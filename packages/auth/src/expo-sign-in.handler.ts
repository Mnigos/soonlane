import { expo } from '@better-auth/expo'
import {
	type AuthContext,
	type BetterAuthPlugin,
	getAuthStateVerificationIdentifier,
} from 'better-auth'
import { createAuthMiddleware } from 'better-auth/api'
import { z } from 'zod'

/** The mobile app's scheme: Better Auth's trusted list has it, `returnAddresses` accepts it only on a sign-in, and the Expo plugin adds the new session's cookie to it. */
export const MOBILE_APP_SCHEME = 'soonlane:'
/** The scheme Expo Go opens a development build of the app under. */
export const EXPO_GO_SCHEME = 'exp:'
/** Where the mobile app opens a sign-in in the system browser; it signs the OAuth state into whichever browser opens it. */
export const EXPO_PROXY_PATH = '/expo-authorization-proxy'
/** The origin of Google's authorization endpoint (`@better-auth/core` `social-providers/google`); a state's row does not name its provider. */
const GOOGLE_AUTHORIZATION_ORIGIN = 'https://accounts.google.com'

/**
 * Better Auth's Expo plugin without its `init`, which trusts `exp://` whenever
 * `NODE_ENV` is `development`: `bun build` inlines `NODE_ENV` and makes it
 * `development` when the build environment sets none. `createAuth` trusts the
 * app's schemes itself. After the plugin copies a callback's cookies into its
 * app-scheme redirect, the browser gets none of them: through the proxy,
 * someone could finish their own app sign-in in another person's browser.
 */
export function expoSignIn(appSchemes: readonly string[]) {
	const { id, version, onRequest, hooks, endpoints } = expo()

	return {
		id,
		version,
		onRequest,
		hooks: {
			after: [
				...hooks.after,
				{
					matcher: context => context.path?.startsWith('/callback') ?? false,
					handler: createAuthMiddleware(async ctx => {
						const headers = ctx.context.responseHeaders
						const location = URL.parse(headers?.get('location') ?? '')

						if (location && appSchemes.includes(location.protocol))
							headers?.delete('set-cookie')
					}),
				},
			],
		},
		endpoints,
	} satisfies BetterAuthPlugin
}

/** The addresses a pending OAuth state redirects to, from the JSON Better Auth stores in its verification row; a state with `link` fails. */
const pendingSignInSchema = z.object({
	callbackURL: z.string(),
	newUserURL: z.string().optional(),
	errorURL: z.string().optional(),
	link: z.never().optional(),
})

/**
 * Whether the Expo proxy may sign `authorizationURL`'s state into the browser
 * that opens it: one Google URL whose state is a pending sign-in, not an
 * account link, that returns only to an app scheme. Otherwise a Todoist link
 * someone else started would link the opener's Todoist to the starter's account.
 */
export async function isPendingAppSignIn(
	adapter: AuthContext['internalAdapter'],
	authorizationURL: unknown,
	appSchemes: readonly string[]
) {
	const url =
		typeof authorizationURL === 'string' ? URL.parse(authorizationURL) : null
	const state =
		url?.origin === GOOGLE_AUTHORIZATION_ORIGIN
			? url.searchParams.get('state')
			: null
	const stored = state
		? await adapter.findVerificationValue(
				getAuthStateVerificationIdentifier(state)
			)
		: null

	if (!stored || new Date(stored.expiresAt) < new Date()) return false

	const pending = pendingSignInSchema.safeParse(parseJson(stored.value))

	return (
		pending.success &&
		[
			pending.data.callbackURL,
			pending.data.newUserURL,
			pending.data.errorURL,
		].every(
			address =>
				address === undefined ||
				appSchemes.includes(URL.parse(address)?.protocol ?? '')
		)
	)
}

/** `JSON.parse` that answers `undefined` for text that is not JSON, so a corrupt row is refused like a missing one. */
function parseJson(text: string): unknown {
	try {
		return JSON.parse(text)
	} catch {
		return undefined
	}
}
