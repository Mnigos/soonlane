import { CONSENT_COOKIE } from '@soonlane/analytics'
import { AUTH_COOKIE_PREFIX } from '@soonlane/auth'
import { PROXY_SECRET_HEADER, VISITOR_IP_HEADER } from '@soonlane/contracts'
import { getRequest, getRequestIP } from '@tanstack/react-start/server'

const FORWARDED_REQUEST_HEADERS = [
	'content-type',
	'origin',
	'referer',
	'user-agent',
	'accept',
	'sec-fetch-site',
	'sec-fetch-mode',
	'sec-fetch-dest',
]
/** Hop-by-hop headers (RFC 9110) describe one connection and never pass a proxy. */
const HOP_BY_HOP_HEADERS = [
	'connection',
	'keep-alive',
	'proxy-authenticate',
	'proxy-authorization',
	'te',
	'trailer',
	'transfer-encoding',
	'upgrade',
]
/** fetch has already decoded the body and set its own framing. */
const DROPPED_RESPONSE_HEADERS = [
	...HOP_BY_HOP_HEADERS,
	'content-encoding',
	'content-length',
	'set-cookie',
]
// `state` is Better Auth's signed OAuth state, checked on Google's callback; without it sign-in fails.
const AUTH_COOKIES = ['session_token', 'session_data', 'dont_remember', 'state']
const API_COOKIE_NAMES = new Set([
	CONSENT_COOKIE,
	...AUTH_COOKIES.flatMap(name => [
		`${AUTH_COOKIE_PREFIX}.${name}`,
		`__Secure-${AUTH_COOKIE_PREFIX}.${name}`,
	]),
])

/** `API_INTERNAL_URL` and `API_PROXY_SECRET`, read per call so the prerender, which calls no API, needs neither. */
export function readApiSettings() {
	const url = process.env.API_INTERNAL_URL
	const secret = process.env.API_PROXY_SECRET

	if (!url) throw new Error('API_INTERNAL_URL is not set')
	if (!secret) throw new Error('API_PROXY_SECRET is not set')

	const origin = new URL(url)

	if (origin.protocol !== 'https:' && !import.meta.env.DEV)
		throw new Error('API_INTERNAL_URL must use https outside development')

	return { origin: origin.origin, secret }
}

/** Only Better Auth's cookies (by name, `__Secure-` on https) and the consent answer reach the API; the sidebar preference and PostHog's cookies stay here. */
function filterCookies(cookieHeader: string) {
	return cookieHeader
		.split(';')
		.map(part => part.trim())
		.filter(part => API_COOKIE_NAMES.has(part.split('=', 1)[0] ?? ''))
		.join('; ')
}

/**
 * Adds what the API needs to know about the visitor of the current request:
 * their API cookies, their IP (Vercel overwrites `x-forwarded-for`; locally
 * the socket's address) and the proxy secret that makes the API trust that IP.
 */
export function addVisitorHeaders(headers: Headers, secret: string) {
	const cookie = filterCookies(getRequest().headers.get('cookie') ?? '')
	const ip = getRequestIP({ xForwardedFor: true })

	headers.set(PROXY_SECRET_HEADER, secret)
	if (cookie) headers.set('cookie', cookie)
	if (ip) headers.set(VISITOR_IP_HEADER, ip)

	return headers
}

/** `undefined` when the API cannot be reached; only the error name is logged, never the URL. */
async function fetchApi(url: string, init: RequestInit) {
	try {
		return await fetch(url, init)
	} catch (error) {
		console.error(
			'API request failed',
			error instanceof Error ? error.name : typeof error
		)

		return undefined
	}
}

/** The fixed set plus every header the upstream `Connection` header names. */
function getDroppedResponseHeaders(headers: Headers) {
	return new Set([
		...DROPPED_RESPONSE_HEADERS,
		...(headers.get('connection') ?? '')
			.split(',')
			.map(name => name.trim().toLowerCase())
			.filter(Boolean),
	])
}

/**
 * Forwards the current browser request for `/api/auth/*` or `/api/rpc/*` to
 * the API on the same path. Redirects and every `Set-Cookie` come back
 * unchanged, so Google sign-in and session refreshes work as if the API
 * answered here.
 */
export async function forwardToApi(request: Request) {
	const { pathname, search } = new URL(request.url)
	const { origin, secret } = readApiSettings()
	const headers = new Headers()

	for (const name of FORWARDED_REQUEST_HEADERS) {
		const value = request.headers.get(name)

		if (value) headers.set(name, value)
	}

	const hasBody = request.method !== 'GET' && request.method !== 'HEAD'
	const init = {
		method: request.method,
		headers: addVisitorHeaders(headers, secret),
		body: hasBody ? await request.arrayBuffer() : undefined,
		redirect: 'manual',
	} satisfies RequestInit
	const upstream = await fetchApi(`${origin}${pathname}${search}`, init)

	if (!upstream) return new Response('Bad Gateway', { status: 502 })
	const dropped = getDroppedResponseHeaders(upstream.headers)
	const responseHeaders = new Headers()

	for (const [name, value] of upstream.headers)
		if (!dropped.has(name)) responseHeaders.append(name, value)
	for (const cookie of upstream.headers.getSetCookie())
		responseHeaders.append('set-cookie', cookie)

	return new Response(upstream.body, {
		status: upstream.status,
		headers: responseHeaders,
	})
}
