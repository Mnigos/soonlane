import { createMiddleware } from '@tanstack/react-start'

/**
 * Keeps error pages, a missing asset's 404 included, out of every cache. Nitro
 * drops the `no-cache` route rule from a 4xx or 5xx response, and Cloudflare
 * would otherwise keep a 404 for minutes.
 */
export const errorCacheMiddleware = createMiddleware().server(
	async ({ next }) => {
		const { response } = await next()

		if (response.status < 400) return response

		const headers = new Headers(response.headers)

		headers.set('cache-control', 'no-store')

		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers,
		})
	}
)
