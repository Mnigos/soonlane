const PROXY_PREFIX = '/ingest'
const API_HOST = 'https://eu.i.posthog.com'
const ASSETS_HOST = 'https://eu-assets.i.posthog.com'
const ASSET_PATH = /^\/(?:static|array)\//u
const UPSTREAM_TIMEOUT_MS = 10_000
// No cookies or Authorization: the app's session must never reach PostHog.
const REQUEST_HEADERS = [
	'content-type',
	'content-encoding',
	'user-agent',
	'x-forwarded-for',
]
// Without content-encoding and content-length: fetch has already decompressed the body.
const RESPONSE_HEADERS = ['content-type', 'cache-control']

function pickHeaders(headers: Headers, names: readonly string[]) {
	return new Headers(
		names.flatMap(name => {
			const value = headers.get(name)

			return value ? [[name, value] as const] : []
		})
	)
}

/** Forwards the browser SDK's `/ingest/*` requests to PostHog's EU hosts; the host never comes from the request. */
export async function proxyToPostHog(request: Request) {
	const { pathname, search } = new URL(request.url)
	const path = pathname.slice(PROXY_PREFIX.length)
	const host = ASSET_PATH.test(path) ? ASSETS_HOST : API_HOST
	const body =
		request.method === 'POST' ? await request.arrayBuffer() : undefined

	try {
		const upstream = await fetch(`${host}${path}${search}`, {
			method: request.method,
			headers: pickHeaders(request.headers, REQUEST_HEADERS),
			body,
			redirect: 'manual',
			signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
		})

		return new Response(upstream.body, {
			status: upstream.status,
			headers: pickHeaders(upstream.headers, RESPONSE_HEADERS),
		})
	} catch (error) {
		if (error instanceof DOMException && error.name === 'TimeoutError')
			return new Response('Gateway Timeout', { status: 504 })

		return new Response('Bad Gateway', { status: 502 })
	}
}
