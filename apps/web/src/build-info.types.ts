import type { AppEnvironment } from './modules/analytics/domain/analytics-event.types'

// Replaced at build time: the APP_* values by vite.config.ts `define`, VITE_POSTHOG_KEY from the environment.
declare global {
	interface ImportMetaEnv {
		readonly APP_VERSION: string
		readonly APP_COMMIT: string
		readonly APP_ENVIRONMENT: AppEnvironment
		readonly VITE_POSTHOG_KEY?: string
	}
}
