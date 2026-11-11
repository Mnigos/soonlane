import {
	appendResponseHeader,
	getRequestHeader,
	getRequestUrl,
} from '@tanstack/react-start/server'

/** The page's own origin; `getRequestUrl` takes the scheme from `x-forwarded-proto`, since Vercel terminates TLS. */
export function getRequestOrigin() {
	return getRequestUrl().origin
}

/**
 * Calls the API as the visitor: only their `cookie` header goes along, and
 * every `Set-Cookie` the API answers with (a refreshed session) goes onto the
 * page's response. No rate-limited endpoint is reached from here today: Better
 * Auth limits only requests through its own handler at `/api/auth`.
 * Once the API runs on another machine it sees this server's IP, so a
 * rate-limited call from here must carry the visitor's IP in a header only
 * this server can set.
 */
export async function fetchAsVisitor(url: string, init: RequestInit) {
	const headers = new Headers(init.headers)
	const cookie = getRequestHeader('cookie')

	if (cookie) headers.set('cookie', cookie)

	const response = await fetch(url, { ...init, headers })
	const cookies = response.headers.getSetCookie()

	if (cookies.length > 0) appendResponseHeader('set-cookie', cookies)

	return response
}
