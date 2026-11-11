import { hasAnalyticsConsent } from '@soonlane/analytics'
import { type AuthLogLevel, createAuth } from '@soonlane/auth/server'
import { toUserId } from '@soonlane/domain'
import { Effect, Layer, Redacted } from 'effect'
import {
	Analytics,
	AnalyticsConsent,
} from '@/modules/analytics/application/analytics.port'
import { AppConfig } from '@/platform/config/app.config'
import { Db } from '@/platform/db/db.layer'
import { Auth } from '../application/auth.port'

const LOG_BY_LEVEL = {
	debug: Effect.logDebug,
	info: Effect.logInfo,
	warn: Effect.logWarning,
	error: Effect.logError,
} as const satisfies Record<
	AuthLogLevel,
	(...message: readonly unknown[]) => Effect.Effect<void>
>

function withRequestConsent(headers?: Headers) {
	return Effect.provideService(
		AnalyticsConsent,
		headers ? hasAnalyticsConsent(headers) : false
	)
}

export const BetterAuthLive = Layer.effect(
	Auth,
	Effect.gen(function* () {
		const config = yield* AppConfig
		const db = yield* Db
		const analytics = yield* Analytics
		const auth = createAuth({
			database: db.database,
			baseUrl: config.appUrl,
			trustedOrigins: config.trustedOrigins,
			secret: Redacted.value(config.authSecret),
			allowedEmails: config.allowedEmails,
			google: {
				clientId: config.googleClientId,
				clientSecret: Redacted.value(config.googleClientSecret),
			},
			log: (level, ...message) =>
				Effect.runSync(LOG_BY_LEVEL[level](...message)),
			events: {
				userCreated: async ({ id, createdAt }, headers) =>
					await Effect.runPromise(
						analytics
							.capture(toUserId(id), 'user_signed_up', {
								$set_once: {
									created_at: createdAt.toISOString(),
									signup_date: createdAt.toISOString().slice(0, 10),
								},
							})
							.pipe(withRequestConsent(headers))
					),
				sessionCreated: async (userId, method, headers) =>
					await Effect.runPromise(
						analytics
							.capture(toUserId(userId), 'user_signed_in', { method })
							.pipe(withRequestConsent(headers))
					),
			},
		})

		return Auth.of({
			handle: async request => await auth.handler(request),
			getSession: async headers => {
				const { headers: responseHeaders, response: result } =
					await auth.api.getSession({ headers, returnHeaders: true })
				const setCookies = responseHeaders.getSetCookie()

				if (!result) return { session: null, setCookies }

				return {
					session: {
						user: {
							id: toUserId(result.user.id),
							email: result.user.email,
							name: result.user.name,
							emailVerified: result.user.emailVerified,
							image: result.user.image ?? undefined,
						},
					},
					setCookies,
				}
			},
		})
	})
)
