import type { AppEnvironment } from '@soonlane/analytics'
import { getSignedInHintCookie } from '@soonlane/auth'

interface SiteEnvironment {
	appOrigin: string
	apiOrigin: string
	cookiePrefix: string
}

/** What `.railway/railway.ts` gives the app and the API in each environment; `APP_ENV` picks one at build time. */
const SITE_ENVIRONMENTS = {
	production: {
		appOrigin: 'https://app.soonlane.com',
		apiOrigin: 'https://api.soonlane.com',
		cookiePrefix: 'soonlane',
	},
	staging: {
		appOrigin: 'https://app.staging.soonlane.com',
		apiOrigin: 'https://api.staging.soonlane.com',
		cookiePrefix: 'soonlane-staging',
	},
	development: {
		appOrigin: 'http://localhost:3000',
		apiOrigin: 'http://localhost:4000',
		cookiePrefix: 'soonlane-dev',
	},
} satisfies Record<AppEnvironment, SiteEnvironment>

export const {
	appOrigin: APP_ORIGIN,
	apiOrigin: API_ORIGIN,
	cookiePrefix: AUTH_COOKIE_PREFIX,
} = SITE_ENVIRONMENTS[import.meta.env.APP_ENVIRONMENT]
export const SIGNED_IN_HINT_COOKIE = getSignedInHintCookie(AUTH_COOKIE_PREFIX)
