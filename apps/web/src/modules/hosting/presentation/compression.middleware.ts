import { createMiddleware } from '@tanstack/react-start'

/** Text Start renders or reads from disk; files Nitro lists at build time are served precompressed already. */
const COMPRESSIBLE_TYPE =
	/^(?:text\/(?!event-stream)|application\/(?:json|javascript|xml|rss\+xml)|image\/svg\+xml)/u

/** Whether the `Accept-Encoding` header lists gzip without refusing it through `q=0`. */
function acceptsGzip(header: string) {
	return header
		.toLowerCase()
		.split(',')
		.some(entry => {
			const [coding, ...params] = entry.split(';').map(part => part.trim())
			const quality = params.find(param => param.startsWith('q='))

			return coding === 'gzip' && (!quality || Number(quality.slice(2)) > 0)
		})
}

/** Gzips text responses for clients that accept it, since Bun's server and Railway's edge send them as they are. */
export const compressionMiddleware = createMiddleware().server(
	async ({ request, next }) => {
		const { response } = await next()

		// The dev server's proxy decompresses the body but keeps the header.
		if (
			import.meta.env.DEV ||
			!response.body ||
			response.headers.has('content-encoding') ||
			!COMPRESSIBLE_TYPE.test(response.headers.get('content-type') ?? '') ||
			!acceptsGzip(request.headers.get('accept-encoding') ?? '')
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
