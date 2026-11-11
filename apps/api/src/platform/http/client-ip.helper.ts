import { createHash, timingSafeEqual } from 'node:crypto'
import { BlockList, isIP } from 'node:net'
import { CLIENT_IP_HEADER } from '@soonlane/auth/server'
import { PROXY_SECRET_HEADER, VISITOR_IP_HEADER } from '@soonlane/contracts'
import { Effect } from 'effect'
import { CLOUDFLARE_IP_RANGES } from './cloudflare-ip-ranges.constants'

type RequestHandler = (request: Request) => Promise<Response>

/** Railway's edge overwrites it with the address that connected to Railway. */
const RAILWAY_IP_HEADER = 'x-real-ip'
const CLOUDFLARE_IP_HEADER = 'cf-connecting-ip'

function toFamily(ip: string) {
	return isIP(ip) === 6 ? 'ipv6' : 'ipv4'
}

const cloudflareRanges = new BlockList()

for (const range of CLOUDFLARE_IP_RANGES) {
	const [network = '', prefix] = range.split('/')

	cloudflareRanges.addSubnet(network, Number(prefix), toFamily(network))
}

function toSingleIp(value: string | null) {
	const ip = value?.trim()

	return ip && isIP(ip) ? ip : undefined
}

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

/** Without the proxy secret: Railway's header, or `CF-Connecting-IP` when that address is a Cloudflare edge (the proxied production host). */
function resolveDirectIp(headers: Headers) {
	const railwayIp = toSingleIp(headers.get(RAILWAY_IP_HEADER))

	if (!railwayIp) return undefined
	if (!cloudflareRanges.check(railwayIp, toFamily(railwayIp))) return railwayIp

	return toSingleIp(headers.get(CLOUDFLARE_IP_HEADER))
}

/**
 * Works out one client IP and hands the request on with it in
 * `CLIENT_IP_HEADER`, the only IP header Better Auth reads. A request with the
 * right proxy secret comes from the web server, which names the visitor; a
 * wrong secret is refused. A request without a client IP gets 400, so none
 * shares Better Auth's rate limit bucket for unknown addresses. The secret and
 * the visitor IP never reach the handler.
 */
export function withClientIp(proxySecret: string, handle: RequestHandler) {
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
			Effect.runSync(Effect.logWarning('Refused a wrong proxy secret'))

			return reject(403)
		}

		const ip = secret === null ? resolveDirectIp(headers) : visitorIp

		if (!ip) return reject(400)
		headers.set(CLIENT_IP_HEADER, ip)

		return await handle(new Request(request, { headers }))
	}
}
