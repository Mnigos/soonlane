import { canValidateSessions, isAuthConfigured } from '@soonlane/auth'
import { type AuthLogLevel, createAuth } from '@soonlane/auth/server'
import { toUserId } from '@soonlane/domain'
import { Effect, Layer, Redacted } from 'effect'
import {
	Analytics,
	AnalyticsConsent,
} from '@/modules/analytics/application/analytics.port'
import { hasAnalyticsConsent } from '@/modules/consent/domain/consent.helper'
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

async function respondNotConfigured() {
	return Response.json(
		{ message: 'Google sign-in is not configured.' },
		{ status: 503 }
	)
}

function withRequestConsent(headers?: Headers) {
	return Effect.provideService(
		AnalyticsConsent,
		headers ? hasAnalyticsConsent(headers) : false
	)
}

const unconfiguredAuth = Auth.of({
	configured: false,
	handle: respondNotConfigured,
	getSession: async () => null,
})

export const BetterAuthLive = Layer.effect(
	Auth,
	Effect.gen(function* () {
		const config = yield* AppConfig
		const db = yield* Db
		const analytics = yield* Analytics
		const settings = { ...config, secret: Redacted.value(config.authSecret) }

		if (!canValidateSessions(settings)) return unconfiguredAuth

		const googleConfigured = isAuthConfigured(settings)
		const auth = createAuth({
			database: db.database,
			baseUrl: config.baseUrl,
			trustedOrigins: config.trustedOrigins,
			secret: settings.secret,
			allowedEmails: config.allowedEmails,
			google: googleConfigured
				? {
						clientId: config.googleClientId,
						clientSecret: config.googleClientSecret,
					}
				: undefined,
			oauthProxy: config.oauthProxy
				? {
						productionUrl: config.appUrl,
						secret:
							config.oauthProxySecret &&
							Redacted.value(config.oauthProxySecret),
					}
				: undefined,
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
			configured: googleConfigured,
			handle: googleConfigured
				? async request => await auth.handler(request)
				: respondNotConfigured,
			getSession: async headers => {
				const result = await auth.api.getSession({ headers })

				if (!result) return null

				return {
					user: {
						id: toUserId(result.user.id),
						email: result.user.email,
						name: result.user.name,
						emailVerified: result.user.emailVerified,
						image: result.user.image ?? undefined,
					},
				}
			},
		})
	})
)
