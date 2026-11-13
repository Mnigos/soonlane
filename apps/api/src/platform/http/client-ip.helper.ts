import { createHash, timingSafeEqual } from 'node:crypto'
import { resolveEdgeIp, toSingleIp } from '@soonlane/auth/client-ip'
import { CLIENT_IP_HEADER } from '@soonlane/auth/server'
import { PROXY_SECRET_HEADER, VISITOR_IP_HEADER } from '@soonlane/contracts'
import { type Context, Effect } from 'effect'

type RequestHandler = (request: Request) => Promise<Response>

function digest(value: string) {
	return createHash('sha256').update(value).digest()
}

/** Hashing first gives both sides one length, which `timingSafeEqual` requires. */
function isProxySecret(candidate: string, secret: string) {
	return timingSafeEqual(digest(candidate), digest(secret))
}

function reject(status: 400 | 403) {
	return new Response(null, { status })
}

/**
 * Works out one client IP and hands the request on with it in
 * `CLIENT_IP_HEADER`, the only IP header Better Auth reads. A request with the
 * right proxy secret comes from the web server, which names the visitor; a
 * wrong secret is refused. A request without a client IP gets 400, so none
 * shares Better Auth's rate limit bucket for unknown addresses; only local
 * development, where no edge sets one, passes `localIp` instead. The secret
 * and the visitor IP never reach the handler.
 */
export function withClientIp(
	context: Context.Context<never>,
	proxySecret: string,
	handle: RequestHandler,
	localIp?: string
) {
	return async (request: Request) => {
		const headers = new Headers(request.headers)
		const secret = headers.get(PROXY_SECRET_HEADER)
		const visitorIp = toSingleIp(headers.get(VISITOR_IP_HEADER))

		for (const name of [
			PROXY_SECRET_HEADER,
			VISITOR_IP_HEADER,
			CLIENT_IP_HEADER,
		])
			headers.delete(name)

		if (secret !== null && !isProxySecret(secret, proxySecret)) {
			Effect.runSyncWith(context)(
				Effect.logWarning('Refused a wrong proxy secret')
			)

			return reject(403)
		}

		const ip = (secret === null ? resolveEdgeIp(headers) : visitorIp) ?? localIp

		if (!ip) return reject(400)
		headers.set(CLIENT_IP_HEADER, ip)

		return await handle(new Request(request, { headers }))
	}
}
