import { getConsentCookie } from '@soonlane/analytics'
import { PROXY_SECRET_HEADER, VISITOR_IP_HEADER } from '@soonlane/contracts'
import {
	appendResponseHeader,
	getRequest,
	getRequestIP,
} from '@tanstack/react-start/server'
import { AUTH_COOKIE_PREFIX } from '@/modules/identity/presentation/auth-cookie.constants'

const AUTH_COOKIES = ['session_token', 'session_data', 'dont_remember']
const API_COOKIE_NAMES = new Set([
	getConsentCookie(AUTH_COOKIE_PREFIX),
	...AUTH_COOKIES.flatMap(name => [
		`${AUTH_COOKIE_PREFIX}.${name}`,
		`__Secure-${AUTH_COOKIE_PREFIX}.${name}`,
	]),
])

/** `API_INTERNAL_URL` and `API_PROXY_SECRET`, read per call so the prerender, which calls no API, needs neither. */
function readApiSettings() {
	const url = process.env.API_INTERNAL_URL
	const secret = process.env.API_PROXY_SECRET

	if (!url) throw new Error('API_INTERNAL_URL is not set')
	if (!secret) throw new Error('API_PROXY_SECRET is not set')

	const origin = new URL(url)

	if (origin.protocol !== 'https:' && !import.meta.env.DEV)
		throw new Error('API_INTERNAL_URL must use https outside development')

	return { origin: origin.origin, secret }
}

/** Only this environment's Better Auth cookies (by name, `__Secure-` on https) and consent answer reach the API; another environment's, the sidebar preference and PostHog's stay here. */
function filterCookies(cookieHeader: string) {
	return cookieHeader
		.split(';')
		.map(part => part.trim())
		.filter(part => API_COOKIE_NAMES.has(part.split('=', 1)[0] ?? ''))
		.join('; ')
}

/** SSR calls the API directly at `API_INTERNAL_URL`. */
export function getInternalApiOrigin() {
	return readApiSettings().origin
}

/**
 * Calls the API as the visitor: their cookies of this environment, their IP
 * (Vercel overwrites `x-forwarded-for`; locally the socket's address) and the
 * proxy secret that makes the API trust that IP. Every `Set-Cookie` the API
 * answers with (a refreshed session) goes onto the page's response.
 */
export async function fetchAsVisitor(url: string, init: RequestInit) {
	const headers = new Headers(init.headers)
	const cookie = filterCookies(getRequest().headers.get('cookie') ?? '')
	const ip = getRequestIP({ xForwardedFor: true })

	headers.set(PROXY_SECRET_HEADER, readApiSettings().secret)
	if (cookie) headers.set('cookie', cookie)
	if (ip) headers.set(VISITOR_IP_HEADER, ip)

	const response = await fetch(url, { ...init, headers })
	const cookies = response.headers.getSetCookie()

	if (cookies.length > 0) appendResponseHeader('set-cookie', cookies)

	return response
}
