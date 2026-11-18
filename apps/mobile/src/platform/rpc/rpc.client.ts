import { RPCLink } from '@orpc/client/fetch'
import { TimeoutLinkPlugin } from '@orpc/client/plugins'
import { MOBILE_APP, MOBILE_APP_HEADER } from '@soonlane/auth'
import { API_URL, authClient } from '@/platform/auth/auth.client'

/** React Native's Android networking never times out on its own; a stalled call would leave its query loading forever instead of showing the retry. */
const RPC_TIMEOUT_MS = 30_000

/** Provided to `@soonlane/app` once, by the root layout. Sends the Keychain's session cookie as the Better Auth client does. */
export const rpcLink = new RPCLink({
	url: '/api/rpc',
	origin: API_URL,
	headers: async () => ({
		cookie: (await authClient.getCookie()) || undefined,
		// The API then never refreshes the session here, since only the auth client stores refreshed cookies.
		[MOBILE_APP_HEADER]: MOBILE_APP,
	}),
	fetch: async (url, init) =>
		await fetch(url, { ...init, credentials: 'omit' }),
	plugins: [new TimeoutLinkPlugin({ timeout: RPC_TIMEOUT_MS })],
})
