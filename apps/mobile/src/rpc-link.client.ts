import { RPCLink } from '@orpc/client/fetch'

/** Metro inlines `EXPO_PUBLIC_*` at bundle time; Expo types `process` as `NodeJS.Process`, which is `any` without Node's types. */
const env = process.env as Record<string, string | undefined>
/** The local API on this Mac; the iOS Simulator shares the host's loopback. */
const API_ORIGIN = env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4064'
/** Spike only: a session cookie from `bun run dev:session` on the local database, inlined by Metro at start. */
const SESSION_COOKIE = env.EXPO_PUBLIC_SPIKE_SESSION_COOKIE ?? ''

/**
 * React Native has no cookie-bound browser origin, so the link sends the
 * session as a `Cookie` header itself. `X-Real-IP` stands in for Railway's
 * edge, which the API requires on every `/api/rpc` request.
 */
export const rpcLink = new RPCLink({
	url: '/api/rpc',
	origin: API_ORIGIN,
	fetch: async (url, init): Promise<Response> => {
		const headers = new Headers(init.headers)

		headers.set('cookie', `soonlane-dev.session_token=${SESSION_COOKIE}`)
		headers.set('x-real-ip', '127.0.0.1')

		return await fetch(url, { ...init, headers, credentials: 'omit' })
	},
})
