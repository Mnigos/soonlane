import { captureException, trackRouter } from '@soonlane/analytics/client'
import { createRouter } from '@tanstack/react-router'
import { BROWSER_ANALYTICS_OPTIONS } from './modules/analytics/presentation/browser-analytics.constants'
import { routeTree } from './routeTree.gen'

export function getRouter() {
	const router = createRouter({
		routeTree,
		scrollRestoration: true,
		defaultOnCatch: captureException,
	})

	trackRouter(router, BROWSER_ANALYTICS_OPTIONS)

	return router
}

declare module '@tanstack/react-router' {
	interface Register {
		router: ReturnType<typeof getRouter>
	}
}
