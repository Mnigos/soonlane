import type { UserId } from '@soonlane/domain'
import { Effect, Layer } from 'effect'
import { PostHog } from 'posthog-node'
import { AppConfig } from '@/platform/config/app.config'
import { Analytics, AnalyticsConsent } from '../application/analytics.port'
import type { ServerEvents } from '../domain/analytics-event.types'
import { BUILD_PROPERTIES } from '../domain/analytics.constants'

const POSTHOG_HOST = 'https://eu.i.posthog.com'
const REQUEST_TIMEOUT_MS = 3000

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

function deliver(send: () => Promise<void>) {
	return Effect.tryPromise({ try: send, catch: toErrorName }).pipe(
		Effect.catch(error => Effect.logWarning('PostHog capture failed', error))
	)
}

/** Sends each event before the request ends (a Vercel function can freeze right after); a no-op without a key. Exceptions need no consent. */
export const PostHogAnalyticsLive = Layer.effect(
	Analytics,
	Effect.gen(function* () {
		const { posthogKey } = yield* AppConfig

		if (!posthogKey) return disabledAnalytics

		const client = yield* Effect.acquireRelease(
			Effect.sync(
				() =>
					new PostHog(posthogKey, {
						host: POSTHOG_HOST,
						flushAt: 1,
						flushInterval: 0,
						requestTimeout: REQUEST_TIMEOUT_MS,
						fetchRetryCount: 0,
					})
			),
			created => Effect.promise(async () => await created.shutdown())
		)

		const capture = Effect.fn('Analytics.capture')(function* (
			userId: UserId,
			event: keyof ServerEvents,
			properties: ServerEvents[keyof ServerEvents]
		) {
			if (!(yield* AnalyticsConsent)) return

			yield* deliver(
				async () =>
					await client.captureImmediate({
						distinctId: userId,
						event,
						properties: { ...BUILD_PROPERTIES, ...properties },
					})
			)
		})

		const captureException = Effect.fn('Analytics.captureException')(function* (
			error: unknown,
			userId?: UserId
		) {
			yield* deliver(
				async () =>
					await client.captureExceptionImmediate(
						toSafeError(error),
						userId,
						BUILD_PROPERTIES
					)
			)
		})

		return Analytics.of({ capture, captureException })
	})
)
