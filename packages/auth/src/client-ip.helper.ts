import { BlockList, isIP } from 'node:net'
import { CLOUDFLARE_IP_RANGES } from './cloudflare-ip-ranges.constants'

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

/** The trimmed value when it is one valid address. */
export function toSingleIp(value: string | null) {
	const ip = value?.trim()

	return ip && isIP(ip) ? ip : undefined
}

/**
 * The address of the client that reached a Railway service: Railway's
 * header, or `CF-Connecting-IP` when that address is a Cloudflare edge (a host
 * proxied by Cloudflare). A client that reaches Railway directly shows its own
 * address in `X-Real-IP`, so a forged `CF-Connecting-IP` is ignored.
 */
export function resolveEdgeIp(headers: Headers) {
	const railwayIp = toSingleIp(headers.get(RAILWAY_IP_HEADER))

	if (!railwayIp) return undefined
	if (!cloudflareRanges.check(railwayIp, toFamily(railwayIp))) return railwayIp

	return toSingleIp(headers.get(CLOUDFLARE_IP_HEADER))
}
