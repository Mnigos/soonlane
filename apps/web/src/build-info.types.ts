import type { AppEnvironment } from '@soonlane/analytics'

/** Replaced at build time: the APP_* values by vite.config.ts `define`, the VITE_* values from the environment. */
declare global {
	interface ImportMetaEnv {
		readonly APP_VERSION: string
		readonly APP_COMMIT: string
		readonly APP_ENVIRONMENT: AppEnvironment
		readonly VITE_POSTHOG_KEY?: string
		readonly VITE_API_URL?: string
	}
}
