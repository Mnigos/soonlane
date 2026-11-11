import { appendResponseHeader } from '@tanstack/react-start/server'
import {
	addVisitorHeaders,
	readApiSettings,
} from '@/platform/api/api-proxy.handler'

/** SSR calls the API directly at `API_INTERNAL_URL`, never through this server's own forwarder. */
export function getInternalApiOrigin() {
	return readApiSettings().origin
}

/**
 * Calls the API as the visitor: their API cookies, their IP and the proxy
 * secret go along, and every `Set-Cookie` the API answers with (a refreshed
 * session) goes onto the page's response.
 */
export async function fetchAsVisitor(url: string, init: RequestInit) {
	const headers = addVisitorHeaders(
		new Headers(init.headers),
		readApiSettings().secret
	)
	const response = await fetch(url, { ...init, headers })
	const cookies = response.headers.getSetCookie()

	if (cookies.length > 0) appendResponseHeader('set-cookie', cookies)

	return response
}
