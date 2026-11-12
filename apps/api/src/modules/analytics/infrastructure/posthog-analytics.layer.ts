import type { UserId } from '@soonlane/domain'
import { Effect, Layer } from 'effect'
import { PostHog } from 'posthog-node'
import { AppConfig } from '@/platform/config/app.config'
import { Analytics, AnalyticsConsent } from '../application/analytics.port'
import type { ServerEvents } from '../domain/analytics-event.types'

const POSTHOG_HOST = 'https://eu.i.posthog.com'
const FLUSH_AT = 20
const FLUSH_INTERVAL_MS = 5000
const REQUEST_TIMEOUT_MS = 3000
const FETCH_RETRY_COUNT = 1
/** Bounds the final flush; with the server's drain it has to fit in Railway's `drainingSeconds`. */
const SHUTDOWN_TIMEOUT_MS = 10_000

const disabledAnalytics = Analytics.of({
	capture: () => Effect.void,
	captureException: () => Effect.void,
})

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

/**
 * Queues events and sends them in batches every few seconds, so no request waits for PostHog; a no-op without a key.
 * Releasing the layer (`runtime.dispose()` on SIGTERM) flushes the queue before the process exits. Exceptions need no consent.
 */
export const PostHogAnalyticsLive = Layer.effect(
	Analytics,
	Effect.gen(function* () {
		const { posthogKey, version, commit, environment } = yield* AppConfig

		if (!posthogKey) return disabledAnalytics

		const context = yield* Effect.context()
		const buildProperties = { app_version: version, commit, environment }
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
				properties: { ...buildProperties, ...properties },
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

		return Analytics.of({ capture, captureException })
	})
)
