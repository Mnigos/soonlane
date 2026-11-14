import { createMiddleware } from '@tanstack/react-start'
import { HAND_OFF_PATH_PREFIXES } from './hand-off.constants'

/**
 * Answers 404 to another letter case of a hand-off page, such as
 * `/Android/callback`: the router would render it, but Nitro's `no-store` rule
 * in `vite.config.ts` matches only the canonical spelling and its `no-cache`
 * rule would override any header the page sets.
 */
export const handOffPathMiddleware = createMiddleware().server(
	async ({ pathname, next }) => {
		const path = decodedPath(pathname)
		const isOtherSpelling = HAND_OFF_PATH_PREFIXES.some(
			prefix =>
				path.toLowerCase().startsWith(prefix) && !path.startsWith(prefix)
		)

		if (isOtherSpelling) return new Response('Not Found', { status: 404 })

		return await next()
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
