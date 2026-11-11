import type { BrowserAnalyticsOptions } from '@soonlane/analytics/client'
import type { RegisteredRouter } from '@tanstack/react-router'
import type { FileRoutesByFullPath } from '@/routeTree.gen'
import { BUILD_PROPERTIES } from '../domain/analytics.constants'

/** How this app's router feeds the shared browser analytics. */
export const BROWSER_ANALYTICS_OPTIONS = {
	key: import.meta.env.VITE_POSTHOG_KEY,
	buildProperties: BUILD_PROPERTIES,
	// A label's name is user content and a calendar link's token is a secret.
	privateRoutes: [
		'/app/labels/$name',
		'/calendar/{$token}.ics',
	] satisfies (keyof FileRoutesByFullPath)[],
	getUser: router => {
		const context = router.state.matches.at(-1)?.context

		return context && 'me' in context
			? (context.me.user ?? undefined)
			: undefined
	},
} satisfies BrowserAnalyticsOptions<RegisteredRouter>
