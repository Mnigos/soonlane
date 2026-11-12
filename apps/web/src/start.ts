import { createCsrfMiddleware, createStart } from '@tanstack/react-start'
import { compressionMiddleware } from './modules/hosting/presentation/compression.middleware'
import { errorCacheMiddleware } from './modules/hosting/presentation/error-cache.middleware'
import { prerenderedPagesMiddleware } from './modules/hosting/presentation/prerendered-pages.middleware'

/** Start adds this check to server function calls only while no start instance exists, so it is listed again here. */
const csrfMiddleware = createCsrfMiddleware({
	filter: ({ handlerType }) => handlerType === 'serverFn',
})

/** Outermost first: the error header and gzip also cover the prerendered pages. */
export const startInstance = createStart(() => ({
	requestMiddleware: [
		csrfMiddleware,
		errorCacheMiddleware,
		compressionMiddleware,
		prerenderedPagesMiddleware,
	],
}))
