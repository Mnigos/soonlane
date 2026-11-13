/** The app's origin (`VITE_APP_URL`); its host serves the app, every other host the public site. */
export const APP_ORIGIN =
	import.meta.env.VITE_APP_URL || 'http://localhost:3000'
/** This environment's public site (`VITE_SITE_URL`), where app pages link to the public pages; SEO keeps `SITE_URL`. */
export const SITE_ORIGIN =
	import.meta.env.VITE_SITE_URL || 'http://127.0.0.1:3000'
/** Where the public pages sit in the route tree; the site host's URLs leave it out. */
export const SITE_PREFIX = '/site'
/** Server routes both hosts answer at the same path. */
export const SHARED_PATHS = ['/health', '/robots.txt']
