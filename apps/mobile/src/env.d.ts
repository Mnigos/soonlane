/** Inlined by Metro: from the EAS build profile in eas.json, or from `.env.local` for `expo start`. */
declare namespace NodeJS {
	interface ProcessEnv {
		readonly EXPO_PUBLIC_API_URL?: string
		readonly EXPO_PUBLIC_AUTH_COOKIE_PREFIX?: string
		/** `production`, `staging` or `development`, the `environment` super property. */
		readonly EXPO_PUBLIC_APP_ENV?: string
		/** PostHog's public project key; without it the app asks nothing and sends nothing. */
		readonly EXPO_PUBLIC_POSTHOG_KEY?: string
	}
}
