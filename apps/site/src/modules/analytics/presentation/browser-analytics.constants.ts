import type { BrowserAnalyticsOptions } from '@soonlane/analytics/client'
import type { RegisteredRouter } from '@tanstack/react-router'
import {
	API_ORIGIN,
	AUTH_COOKIE_PREFIX,
} from '@/modules/site/presentation/site-environment.constants'

export const IS_ANALYTICS_ENABLED = Boolean(import.meta.env.VITE_POSTHOG_KEY)

/** How the site's router feeds the shared browser analytics: no private routes and no signed-in user. */
export const BROWSER_ANALYTICS_OPTIONS = {
	key: import.meta.env.VITE_POSTHOG_KEY,
	apiHost: `${API_ORIGIN}/ingest`,
	buildProperties: {
		appVersion: import.meta.env.APP_VERSION,
		commit: import.meta.env.APP_COMMIT,
		environment: import.meta.env.APP_ENVIRONMENT,
	},
	cookiePrefix: AUTH_COOKIE_PREFIX,
	privateRoutes: [],
	getSurface: routeId => (routeId?.startsWith('/blog') ? 'blog' : 'landing'),
} satisfies BrowserAnalyticsOptions<RegisteredRouter>
