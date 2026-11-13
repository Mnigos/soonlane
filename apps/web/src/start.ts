import { createCsrfMiddleware, createStart } from '@tanstack/react-start'
import { compressionMiddleware } from './modules/hosting/presentation/compression.middleware'
import { errorCacheMiddleware } from './modules/hosting/presentation/error-cache.middleware'

/**
 * Start adds this check to server function calls only while no start instance
 * exists, so it is listed again here. Railway's edge ends TLS, so the server
 * sees `http://<host>` while a browser without `Sec-Fetch-Site` sends
 * `https://<host>` as its origin; a cross-site page still sends its own.
 */
const csrfMiddleware = createCsrfMiddleware({
	filter: ({ handlerType }) => handlerType === 'serverFn',
	origin: (origin, { request }) => {
		const url = new URL(request.url)

		return (
			origin === url.origin || origin === new URL(`https://${url.host}`).origin
		)
	},
})

/** Outermost first: the error header also covers gzipped responses. */
export const startInstance = createStart(() => ({
	requestMiddleware: [
		csrfMiddleware,
		errorCacheMiddleware,
		compressionMiddleware,
	],
}))
