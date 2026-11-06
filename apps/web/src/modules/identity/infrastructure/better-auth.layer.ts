import { canValidateSessions, isAuthConfigured } from '@soonlane/auth'
import { type AuthLogLevel, createAuth } from '@soonlane/auth/server'
import { toUserId } from '@soonlane/domain'
import { Effect, Layer, Redacted } from 'effect'
import { PRODUCTION_APP_URL } from '@/platform/config/app-url.helper'
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
		const settings = { ...config, secret: Redacted.value(config.authSecret) }

		if (!canValidateSessions(settings)) return unconfiguredAuth

		const googleConfigured = isAuthConfigured(settings)
		const auth = createAuth({
			database: db.database,
			baseUrl: config.baseUrl,
			trustedOrigins: config.trustedOrigins,
			secret: settings.secret,
			ownerEmail: config.ownerEmail,
			google: googleConfigured
				? {
						clientId: config.googleClientId,
						clientSecret: config.googleClientSecret,
					}
				: undefined,
			oauthProxy: config.oauthProxy
				? {
						productionUrl: PRODUCTION_APP_URL,
						secret:
							config.oauthProxySecret &&
							Redacted.value(config.oauthProxySecret),
					}
				: undefined,
			log: (level, ...message) =>
				Effect.runSync(LOG_BY_LEVEL[level](...message)),
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
