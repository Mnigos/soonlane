import { createMiddleware } from '@tanstack/react-start'

/** Text Start renders or reads from disk; files Nitro lists at build time are served precompressed already. */
const COMPRESSIBLE_TYPE =
	/^(?:text\/(?!event-stream)|application\/(?:json|javascript|xml|rss\+xml)|image\/svg\+xml)/u

/** Gzips text responses for clients that accept it, since Bun's server and Railway's edge send them as they are. */
export const compressionMiddleware = createMiddleware().server(
	async ({ request, next }) => {
		const { response } = await next()

		if (
			!response.body ||
			response.headers.has('content-encoding') ||
			!COMPRESSIBLE_TYPE.test(response.headers.get('content-type') ?? '') ||
			!/\bgzip\b/u.test(request.headers.get('accept-encoding') ?? '')
		)
			return response

		const headers = new Headers(response.headers)

		headers.set('content-encoding', 'gzip')
		headers.delete('content-length')
		headers.append('vary', 'accept-encoding')

		return new Response(
			response.body.pipeThrough(new CompressionStream('gzip')),
			{ status: response.status, statusText: response.statusText, headers }
		)
	}
)
