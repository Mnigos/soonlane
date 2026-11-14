import type { BetterAuthPlugin } from 'better-auth'
import { createAuthEndpoint } from 'better-auth/api'
import { setSessionCookie } from 'better-auth/cookies'
import {
	exchangeBodySchema,
	startHandOffSession,
} from './desktop-sign-in.handler'
import { ANDROID_EXCHANGE_PATH } from './mobile-sign-in.constants'

/**
 * Trades the Android app's hand-off code (minted by `/desktop-sign-in/code`
 * for the app's challenge on `/android/sign-in`) and its verifier for a
 * session cookie, which the app's Expo client stores like any other. Its only
 * check is `startHandOffSession`, the desktop token's; the desktop app has no
 * cookie exchange. Cross-site requests never reach it: the API's `withCors`
 * refuses any foreign `Origin`, and the app's native request sends none.
 */
export function androidSignIn() {
	return {
		id: 'android-sign-in',
		endpoints: {
			exchangeAndroidSignInCode: createAuthEndpoint(
				ANDROID_EXCHANGE_PATH,
				{ method: 'POST', body: exchangeBodySchema },
				async ctx => {
					ctx.setHeader('cache-control', 'no-store')
					await setSessionCookie(
						ctx,
						await startHandOffSession(ctx.context.internalAdapter, ctx.body)
					)

					return await ctx.json({ status: true })
				}
			),
		},
	} satisfies BetterAuthPlugin
}
