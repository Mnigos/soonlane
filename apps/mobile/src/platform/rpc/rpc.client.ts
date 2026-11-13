import { RPCLink } from '@orpc/client/fetch'
import { API_URL, authClient } from '@/platform/auth/auth.client'

/** Provided to `@soonlane/app` once, by the root layout. Sends the Keychain's session cookie as the Better Auth client does. */
export const rpcLink = new RPCLink({
	url: '/api/rpc',
	origin: API_URL,
	headers: async () => ({
		cookie: (await authClient.getCookie()) || undefined,
		// The API then never refreshes the session here, since only the auth client stores refreshed cookies (`MOBILE_APP_HEADER` in apps/api).
		'x-soonlane-app': 'mobile',
	}),
	fetch: async (url, init) =>
		await fetch(url, { ...init, credentials: 'omit' }),
})
