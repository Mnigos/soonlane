/** Replaced at build time by vite.config.ts `define`, from the same APP_URL and API_URL the main process gets, and the public site's SITE_URL. */
declare global {
	interface ImportMetaEnv {
		readonly APP_URL: string
		readonly API_URL: string
		readonly SITE_URL: string
		readonly APP_VERSION: string
		readonly APP_COMMIT: string
	}
}
