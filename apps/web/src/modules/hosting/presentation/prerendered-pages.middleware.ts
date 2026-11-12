import path from 'node:path'
import { createMiddleware } from '@tanstack/react-start'

/**
 * Serves the pages Start prerendered into the public directory next to the
 * running `server/index.mjs`. Start writes them after Nitro has listed its
 * static files, so Nitro never serves them and the page would be rendered again.
 */
export const prerenderedPagesMiddleware = createMiddleware().server(
	async ({ request, pathname, next }) => {
		const page = Bun.file(
			path.join(path.dirname(Bun.main), '../public', pathname, 'index.html')
		)
		const isRead = request.method === 'GET' || request.method === 'HEAD'

		if (!(isRead && (await page.exists()))) return await next()

		return new Response(page, {
			headers: { 'content-type': 'text/html; charset=utf-8' },
		})
	}
)
