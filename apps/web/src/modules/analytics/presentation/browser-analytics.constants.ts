import type { BrowserAnalyticsOptions } from '@soonlane/analytics/client'
import type { RegisteredRouter } from '@tanstack/react-router'
import { AUTH_COOKIE_PREFIX } from '@/modules/identity/presentation/auth-cookie.constants'
import type { FileRoutesByFullPath } from '@/routeTree.gen'
import { BUILD_PROPERTIES } from '../domain/analytics.constants'

/** How this app's router feeds the shared browser analytics. */
export const BROWSER_ANALYTICS_OPTIONS = {
	key: import.meta.env.VITE_POSTHOG_KEY,
	apiHost: `${import.meta.env.VITE_API_URL}/ingest`,
	buildProperties: BUILD_PROPERTIES,
	cookiePrefix: AUTH_COOKIE_PREFIX,
	// Label and project names are user content and a calendar link's token (on the API host) is a secret.
	privateRoutes: [
		...([
			'/labels/$name',
			'/projects/$name',
		] satisfies (keyof FileRoutesByFullPath)[]),
		'/calendar/{$token}.ics',
	],
	getUser: router => {
		const context = router.state.matches.at(-1)?.context

		return context && 'me' in context
			? (context.me.user ?? undefined)
			: undefined
	},
} satisfies BrowserAnalyticsOptions<RegisteredRouter>
