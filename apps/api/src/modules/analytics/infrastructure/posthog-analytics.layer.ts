import { toSnakeCaseKeys } from '@soonlane/analytics'
import type { UserId } from '@soonlane/domain'
import { Effect, Layer, Redacted, Schema } from 'effect'
import { PostHog } from 'posthog-node'
import { AppConfig } from '@/platform/config/app.config'
import { Analytics, AnalyticsConsent } from '../application/analytics.port'
import type { ServerEvents } from '../domain/analytics-event.types'

const POSTHOG_HOST = 'https://eu.i.posthog.com'
/** Takes distinct ids, so no lookup of the person's uuid is needed; PostHog queues the deletion and answers 202. */
const PERSONS_DELETE_URL =
	'https://eu.posthog.com/api/projects/337571/persons/bulk_delete/'
const FLUSH_AT = 20
const FLUSH_INTERVAL_MS = 5000
const REQUEST_TIMEOUT_MS = 3000
const FETCH_RETRY_COUNT = 1
/** Bounds the final flush; with the server's drain it has to fit in Railway's `drainingSeconds`. */
const SHUTDOWN_TIMEOUT_MS = 10_000
const decodeDeletionAnswer = Schema.decodeUnknownEffect(
	Schema.Struct({
		deletion_errors: Schema.optionalKey(Schema.Array(Schema.Unknown)),
	})
)

const disabledAnalytics = Analytics.of({
	capture: () => Effect.void,
	captureException: () => Effect.void,
	deletePerson: () => Effect.void,
})

class PostHogRequestFailedError extends Error {
	override name = 'PostHogRequestFailedError'
}

function toErrorName(error: unknown) {
	return error instanceof Error ? error.name : typeof error
}

/** Name and stack frames only: driver errors embed SQL parameters such as session tokens. */
function toSafeError(error: unknown) {
	const name = toErrorName(error)
	const safe = new Error(name)
	const frames =
		error instanceof Error
			? (error.stack ?? '')
					.split('\n')
					.filter(line => line.trimStart().startsWith('at '))
			: []

	safe.name = name
	safe.stack = [name, ...frames].join('\n')

	return safe
}

/** Fails with the HTTP status or a reason naming no detail: a fetch error's message can hold the Authorization header. */
function requestPersonDeletion(apiKey: Redacted.Redacted, userId: UserId) {
	return Effect.gen(function* () {
		const response = yield* Effect.tryPromise({
			try: async () => {
				const answer = await fetch(PERSONS_DELETE_URL, {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${Redacted.value(apiKey)}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						distinct_ids: [userId],
						delete_events: true,
						delete_recordings: true,
					}),
					signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
				})

				if (!answer.ok) await answer.body?.cancel()

				return answer
			},
			catch: toErrorName,
		})

		if (!response.ok) return yield* Effect.fail(response.status)

		const json = yield* Effect.tryPromise({
			try: async () => await response.json(),
			catch: toErrorName,
		})
		return yield* decodeDeletionAnswer(json).pipe(
			Effect.mapError(() => 'UnexpectedAnswer'),
			Effect.filterOrFail(
				answer => (answer.deletion_errors ?? []).length === 0,
				() => 'deletion_errors'
			)
		)
	})
}

/**
 * Queues events and sends them in batches every few seconds, so no request waits for them; a no-op without a key.
 * Releasing the layer (`runtime.dispose()` on SIGTERM) flushes the queue before the process exits. Exceptions need no consent.
 * Deleting a person also needs the personal API key, and the request waits for PostHog's answer.
 */
export const PostHogAnalyticsLive = Layer.effect(
	Analytics,
	Effect.gen(function* () {
		const { posthogKey, posthogPersonalApiKey, version, commit, environment } =
			yield* AppConfig

		if (!posthogKey) return disabledAnalytics

		const context = yield* Effect.context()
		const buildProperties = toSnakeCaseKeys({
			appVersion: version,
			commit,
			environment,
		})
		const client = yield* Effect.acquireRelease(
			Effect.sync(() => {
				const created = new PostHog(posthogKey, {
					host: POSTHOG_HOST,
					flushAt: FLUSH_AT,
					flushInterval: FLUSH_INTERVAL_MS,
					requestTimeout: REQUEST_TIMEOUT_MS,
					fetchRetryCount: FETCH_RETRY_COUNT,
				})

				// A failed batch surfaces only here; capture itself never throws.
				created.on('error', error =>
					Effect.runSyncWith(context)(
						Effect.logWarning('PostHog batch failed', toErrorName(error))
					)
				)

				return created
			}),
			created =>
				Effect.promise(
					async () => await created.shutdown(SHUTDOWN_TIMEOUT_MS)
				).pipe(Effect.andThen(Effect.logInfo('PostHog queue flushed')))
		)

		const capture = Effect.fn('Analytics.capture')(function* (
			userId: UserId,
			event: keyof ServerEvents,
			properties: ServerEvents[keyof ServerEvents]
		) {
			if (!(yield* AnalyticsConsent)) return

			client.capture({
				distinctId: userId,
				event,
				properties: { ...buildProperties, ...toSnakeCaseKeys(properties) },
			})
		})

		const captureException = Effect.fn('Analytics.captureException')(
			(error: unknown, userId?: UserId, details?: Record<string, string>) =>
				Effect.sync(() =>
					client.captureException(toSafeError(error), userId, {
						...buildProperties,
						...details,
					})
				)
		)

		const deletePerson = Effect.fn('Analytics.deletePerson')(function* (
			userId: UserId
		) {
			if (!posthogPersonalApiKey) return

			// Queued events for this user would otherwise arrive after the deletion and create the person again.
			yield* Effect.tryPromise(async () => await client.flush()).pipe(
				Effect.timeout(REQUEST_TIMEOUT_MS),
				Effect.ignore
			)
			yield* requestPersonDeletion(posthogPersonalApiKey, userId).pipe(
				Effect.retry({
					times: FETCH_RETRY_COUNT,
					while: reason =>
						typeof reason === 'string' || reason === 429 || reason >= 500,
				}),
				// Without the user id: an exception under it would bring the person back.
				Effect.catch(error =>
					Effect.logWarning(
						'PostHog person deletion failed',
						userId,
						error
					).pipe(
						Effect.andThen(
							captureException(new PostHogRequestFailedError(), undefined, {
								reason: String(error),
							})
						)
					)
				)
			)
		})

		return Analytics.of({ capture, captureException, deletePerson })
	})
)
