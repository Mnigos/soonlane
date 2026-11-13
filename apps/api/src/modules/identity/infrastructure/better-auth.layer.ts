import { hasAnalyticsConsent } from '@soonlane/analytics'
import {
	type AuthLogLevel,
	createAuth,
	readStoredOAuthToken,
} from '@soonlane/auth/server'
import { userIdSchema } from '@soonlane/domain'
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
/** The mobile app's API calls send it with `mobile`; its Keychain takes refreshed cookies only from the auth client's own calls, so their lookup never refreshes the session. */
const MOBILE_APP_HEADER = 'x-soonlane-app'

function withRequestConsent(cookiePrefix: string, headers?: Headers) {
	return Effect.provideService(
		AnalyticsConsent,
		headers ? hasAnalyticsConsent(headers, cookiePrefix) : false
	)
}

export const BetterAuthLive = Layer.effect(
	Auth,
	Effect.gen(function* () {
		const config = yield* AppConfig
		const db = yield* Db
		const analytics = yield* Analytics
		const context = yield* Effect.context()
		const auth = createAuth({
			database: db.database,
			baseUrl: config.baseUrl,
			trustedOrigins: config.trustedOrigins,
			trustExpoGo: config.environment === 'development',
			cookiePrefix: config.cookiePrefix,
			cookieDomain: config.cookieDomain,
			errorUrl: `${config.appUrl}/login`,
			secret: Redacted.value(config.authSecret),
			allowedEmails: config.allowedEmails,
			google: {
				clientId: config.googleClientId,
				clientSecret: Redacted.value(config.googleClientSecret),
			},
			todoist: config.todoist && {
				clientId: config.todoist.clientId,
				clientSecret: Redacted.value(config.todoist.clientSecret),
			},
			log: (level, ...message) =>
				Effect.runSyncWith(context)(LOG_BY_LEVEL[level](...message)),
			events: {
				userCreated: async ({ id, createdAt }, headers) =>
					await Effect.runPromiseWith(context)(
						analytics
							.capture(userIdSchema.parse(id), 'user_signed_up', {
								$set_once: {
									createdAt: createdAt.toISOString(),
									signupDate: createdAt.toISOString().slice(0, 10),
								},
							})
							.pipe(withRequestConsent(config.cookiePrefix, headers))
					),
				sessionCreated: async (userId, method, headers) =>
					await Effect.runPromiseWith(context)(
						analytics
							.capture(userIdSchema.parse(userId), 'user_signed_in', { method })
							.pipe(withRequestConsent(config.cookiePrefix, headers))
					),
			},
		})

		return Auth.of({
			handle: async request => await auth.handler(request),
			readStoredToken: async stored => await readStoredOAuthToken(auth, stored),
			getSession: async headers => {
				const { headers: responseHeaders, response: result } =
					await auth.api.getSession({
						headers,
						query: {
							disableRefresh: headers.get(MOBILE_APP_HEADER) === 'mobile',
						},
						returnHeaders: true,
					})
				const setCookies = responseHeaders.getSetCookie()

				if (!result) return { session: null, setCookies }

				return {
					session: {
						user: {
							id: userIdSchema.parse(result.user.id),
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
