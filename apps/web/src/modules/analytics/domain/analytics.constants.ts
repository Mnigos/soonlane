import type { SuperProperties } from './analytics-event.types'

export const BUILD_PROPERTIES = {
	app_version: import.meta.env.APP_VERSION,
	commit: import.meta.env.APP_COMMIT,
	environment: import.meta.env.APP_ENVIRONMENT,
} satisfies Partial<SuperProperties>

export const IS_ANALYTICS_ENABLED = Boolean(import.meta.env.VITE_POSTHOG_KEY)
