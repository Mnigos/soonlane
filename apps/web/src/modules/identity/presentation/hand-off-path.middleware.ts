import { createMiddleware } from '@tanstack/react-start'
import {
	MCP_PAGE_HEADERS,
	MCP_PAGE_PREFIX,
} from '@/modules/mcp/presentation/allow-page.constants'
import { HAND_OFF_PATH_PREFIXES } from './hand-off.constants'

/**
 * Answers 404 to another letter case of a hand-off page or the Allow page, such
 * as `/Android/callback`: the router would render it, but Nitro's `no-store` rule
 * in `vite.config.ts` matches only the canonical spelling and its `no-cache`
 * rule would override any header the page sets. Adds the Allow page's headers to
 * every response under its path, which a route's own headers miss when a parent
 * route fails.
 */
export const handOffPathMiddleware = createMiddleware().server(
	async ({ pathname, next }) => {
		const path = decodedPath(pathname)
		const isOtherSpelling = HAND_OFF_PATH_PREFIXES.some(
			prefix =>
				path.toLowerCase().startsWith(prefix) && !path.startsWith(prefix)
		)

		if (isOtherSpelling) return new Response('Not Found', { status: 404 })

		const result = await next()

		if (!path.startsWith(MCP_PAGE_PREFIX)) return result

		const headers = new Headers(result.response.headers)

		for (const [name, value] of Object.entries(MCP_PAGE_HEADERS))
			headers.set(name, value)

		return new Response(result.response.body, {
			status: result.response.status,
			statusText: result.response.statusText,
			headers,
		})
	}
)

/** Nitro matches its rules on the decoded path, so `/%61ndroid/` already gets `no-store`. */
function decodedPath(pathname: string) {
	try {
		return decodeURIComponent(pathname)
	} catch {
		return pathname
	}
}
