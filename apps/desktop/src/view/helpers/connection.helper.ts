import { ORPCError } from '@orpc/client'

/** The codes of a 502, 503 or 504: a proxy in front of an API that is down or restarting. */
const UNREACHABLE_CODES = new Set<unknown>([
	'BAD_GATEWAY',
	'SERVICE_UNAVAILABLE',
	'GATEWAY_TIMEOUT',
])

/** A failure that says nothing about the request: the network or the API is away, so trying again later can work. */
export function isConnectionError(error: unknown) {
	return (
		error instanceof TypeError ||
		(error instanceof ORPCError && UNREACHABLE_CODES.has(error.code))
	)
}

/** Resolves when the API answers at all; `no-cors`, because `/health` sends no CORS headers and only reachability counts. */
export async function pingApi() {
	await fetch(new URL('/health', import.meta.env.API_URL), {
		mode: 'no-cors',
		cache: 'no-store',
	})
}
