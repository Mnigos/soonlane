import type { BrowserAnalyticsOptions } from '@soonlane/analytics/client'
import type { RegisteredRouter } from '@tanstack/react-router'
import { hasSignedInHint } from '@/modules/landing/presentation/helpers/signed-in-hint.helper'
import {
	API_ORIGIN,
	AUTH_COOKIE_PREFIX,
} from '@/modules/landing/presentation/landing-environment.constants'

export const IS_ANALYTICS_ENABLED = Boolean(import.meta.env.VITE_POSTHOG_KEY)

/**
 * How the landing's router feeds the shared browser analytics: no private routes, and no user to identify. Without the
 * signed-in hint this browser holds no session, so an identity left from an account signed out or deleted is dropped;
 * with it the visitor keeps the identity the app gave them.
 */
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
	getUser: () => (hasSignedInHint() ? undefined : null),
} satisfies BrowserAnalyticsOptions<RegisteredRouter>
