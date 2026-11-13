import { resolveEdgeIp } from '@soonlane/auth/client-ip'

const PROXY_PREFIX = '/ingest'
const API_HOST = 'https://eu.i.posthog.com'
const ASSETS_HOST = 'https://eu-assets.i.posthog.com'
const ASSET_PATH = /^\/(?:static|array)\//u
const UPSTREAM_TIMEOUT_MS = 10_000
/**
 * posthog-js 1.447.3 splits a replay payload at about 6.3 MB (`SEVEN_MEGABYTES`) and its request queue joins what
 * arrives within 3 s into one POST, so this leaves room for three uncompressed; gzip keeps a real batch far below it.
 */
const MAX_BODY_BYTES = 20 * 1024 * 1024
const UPLOAD_TIMEOUT_MS = 30_000
/** No cookies or Authorization: the app's session must never reach PostHog. */
const REQUEST_HEADERS = ['content-type', 'content-encoding', 'user-agent']
/** Without content-encoding and content-length: fetch has already decompressed the body. */
const RESPONSE_HEADERS = ['content-type', 'cache-control']
const SHARED_CACHE_DIRECTIVE = /^(?:public|private|s-maxage=.*)$/iu

class BodyTooLargeError extends Error {
	override name = 'BodyTooLargeError'
}

function pickHeaders(headers: Headers, names: readonly string[]) {
	return new Headers(
		names.flatMap(name => {
			const value = headers.get(name)

			return value ? [[name, value]] : []
		})
	)
}

/** Cloudflare in front of the API ignores `Vary: Origin`, so it must not store an answer whose `Access-Control-Allow-Origin` names one origin; the browser still keeps its own copy. */
function privateCacheControl(value: string | null) {
	const kept = (value ?? '')
		.split(',')
		.map(directive => directive.trim())
		.filter(directive => directive && !SHARED_CACHE_DIRECTIVE.test(directive))

	return ['private', ...kept].join(', ')
}

function capBytes(maxBytes: number) {
	const received = { bytes: 0 }

	return new TransformStream<Uint8Array, Uint8Array>({
		transform(chunk, controller) {
			received.bytes += chunk.byteLength
			if (received.bytes > maxBytes) controller.error(new BodyTooLargeError())
			else controller.enqueue(chunk)
		},
	})
}

async function readBody(request: Request) {
	if (Number(request.headers.get('content-length')) > MAX_BODY_BYTES)
		throw new BodyTooLargeError()
	if (!request.body) return undefined

	return await new Response(
		request.body.pipeThrough(capBytes(MAX_BODY_BYTES), {
			signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
		})
	).arrayBuffer()
}

async function forward(request: Request, body?: ArrayBuffer) {
	const { pathname, search } = new URL(request.url)
	const path = pathname.slice(PROXY_PREFIX.length)
	const host = ASSET_PATH.test(path) ? ASSETS_HOST : API_HOST
	const headers = pickHeaders(request.headers, REQUEST_HEADERS)
	const visitorIp = resolveEdgeIp(request.headers)

	// PostHog places the event by the first address it is given; a browser's own X-Forwarded-For could name any.
	if (visitorIp) headers.set('x-forwarded-for', visitorIp)

	try {
		const upstream = await fetch(`${host}${path}${search}`, {
			method: request.method,
			headers,
			body,
			redirect: 'manual',
			signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
		})
		const answer = pickHeaders(upstream.headers, RESPONSE_HEADERS)

		answer.set(
			'cache-control',
			privateCacheControl(upstream.headers.get('cache-control'))
		)

		return new Response(upstream.body, {
			status: upstream.status,
			headers: answer,
		})
	} catch (error) {
		if (error instanceof DOMException && error.name === 'TimeoutError')
			return new Response('Gateway Timeout', { status: 504 })

		return new Response('Bad Gateway', { status: 502 })
	}
}

/**
 * Forwards the browser SDK's `/ingest/*` requests to PostHog's EU hosts; the host never comes from the request.
 * A POST body over `MAX_BODY_BYTES`, declared or counted as it streams in, gets 413; one still arriving after `UPLOAD_TIMEOUT_MS` gets 408.
 */
export async function proxyToPostHog(request: Request) {
	if (request.method !== 'POST') return await forward(request)

	try {
		return await forward(request, await readBody(request))
	} catch (error) {
		if (error instanceof BodyTooLargeError)
			return new Response('Payload Too Large', { status: 413 })

		return new Response('Request Timeout', { status: 408 })
	}
}
