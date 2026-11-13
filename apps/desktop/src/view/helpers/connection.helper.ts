import { MalformedResponseError, ORPCError } from '@orpc/client'

/** 502, 503 and 504: a proxy in front of an API that is down or restarting. */
const UNREACHABLE_STATUSES = new Set([502, 503, 504])
/** The same statuses when the API itself answered them through oRPC. */
const UNREACHABLE_CODES = new Set<unknown>([
	'BAD_GATEWAY',
	'SERVICE_UNAVAILABLE',
	'GATEWAY_TIMEOUT',
])
/** A ping that hangs counts as no answer, so the next one can start. */
const PING_TIMEOUT_MS = 4000

/** A failure that says nothing about the request: the network or the API is away, so trying again later can work. */
export function isConnectionError(error: unknown) {
	return (
		error instanceof TypeError ||
		(error instanceof ORPCError && UNREACHABLE_CODES.has(error.code)) ||
		// A proxy's own HTML or JSON error page is no oRPC answer.
		(error instanceof MalformedResponseError &&
			UNREACHABLE_STATUSES.has(error.response.status))
	)
}

/**
 * Resolves when something answers at the API's origin, which may still be a
 * proxy's error page: the reloaded routes then fail again and keep this screen.
 * `no-cors`, because `/health` sends no CORS headers and only reachability counts.
 */
export async function pingApi(signal?: AbortSignal) {
	await fetch(new URL('/health', import.meta.env.API_URL), {
		mode: 'no-cors',
		cache: 'no-store',
		signal: AbortSignal.any([
			AbortSignal.timeout(PING_TIMEOUT_MS),
			...(signal ? [signal] : []),
		]),
	})
}
