import {
	defineRailway,
	github,
	postgres,
	preserve,
	project,
	service,
} from 'railway/iac'

/** Owns only what this file declares, so applying it never touches resources made elsewhere, such as production's Postgres. */
export const partial = 'soonlane'

const HOSTS = {
	production: {
		api: 'api.soonlane.com',
		app: 'https://soonlane.com',
		trustedOrigins: 'https://soonlane.com',
		cookiePrefix: 'soonlane',
		cookieDomain: 'soonlane.com',
	},
	staging: {
		api: 'api.staging.soonlane.com',
		app: 'https://staging.soonlane.com',
		trustedOrigins: 'https://staging.soonlane.com',
		cookiePrefix: 'soonlane-staging',
		cookieDomain: 'staging.soonlane.com',
	},
} as const
const PORT = 8080
const REGION = 'europe-west4-drams3a'
/** What the web build reads besides its own app; a change elsewhere, such as `apps/api` or `packages/db`, leaves the site alone. */
const WEB_WATCH_PATTERNS = [
	'/apps/web/**',
	'/packages/analytics/**',
	'/packages/app/**',
	'/packages/auth/**',
	'/packages/contracts/**',
	'/packages/domain/**',
	'/packages/ui/**',
	'/tooling/tailwind-config/**',
	'/tooling/typescript-config/**',
	'/version.json',
	'/CHANGELOG.md',
	'/package.json',
	'/bun.lock',
	'/bunfig.toml',
]
/** The GitHub source of production; staging has none, so only `railway up` from the deploy workflow deploys it. */
const PRODUCTION_SOURCE = github('Mnigos/soonlane', {
	branch: 'main',
	checkSuites: true,
})

function isKnownEnvironment(name: string): name is keyof typeof HOSTS {
	return Object.hasOwn(HOSTS, name)
}

export default defineRailway(ctx => {
	const environment = ctx.environment ?? ''

	if (!isKnownEnvironment(environment))
		throw new Error(`No Railway config for environment "${environment}"`)

	const hosts = HOSTS[environment]
	const isProduction = environment === 'production'
	// Production's Postgres was set up by hand (docs/railway-postgres.md), so only staging declares one here.
	const database = isProduction
		? undefined
		: postgres('Postgres', { region: REGION })

	const api = service('api', {
		source: isProduction ? PRODUCTION_SOURCE : undefined,
		build: {
			builder: 'RAILPACK',
			buildCommand: 'bun run --cwd apps/api build',
			// Railway skips `railway up` uploads that change no watched path too, so staging watches everything.
			watchPatterns: isProduction
				? [
						'/apps/api/**',
						'/packages/analytics/**',
						'/packages/auth/**',
						'/packages/contracts/**',
						'/packages/db/**',
						'/packages/domain/**',
						'/version.json',
						'/tooling/typescript-config/**',
						'/package.json',
						'/bun.lock',
						'/bunfig.toml',
					]
				: null,
		},
		// Runs where the private network is reachable; a failure keeps the previous deployment live.
		preDeploy: 'bun packages/db/scripts/migrate.ts',
		start: 'bun apps/api/dist/main.js',
		healthcheck: '/health',
		// Covers the server's 15 s drain plus PostHog's final flush (`posthog-analytics.layer.ts`) before SIGKILL.
		deploy: { drainingSeconds: 30 },
		regions: { [REGION]: 1 },
		domains: [{ domain: hosts.api, port: PORT }],
		env: {
			PORT: String(PORT),
			APP_ENV: environment,
			API_URL: `https://${hosts.api}`,
			APP_URL: hosts.app,
			TRUSTED_ORIGINS: hosts.trustedOrigins,
			AUTH_COOKIE_PREFIX: hosts.cookiePrefix,
			AUTH_COOKIE_DOMAIN: hosts.cookieDomain,
			// Production holds `${{Postgres.DATABASE_URL}}`, entered by hand.
			DATABASE_URL: database ? database.env.DATABASE_URL : preserve(),
			// Secrets, entered by hand per environment.
			AUTH_SECRET: preserve(),
			GOOGLE_CLIENT_ID: preserve(),
			GOOGLE_CLIENT_SECRET: preserve(),
			API_PROXY_SECRET: preserve(),
			ALLOWED_EMAILS: preserve(),
			POSTHOG_KEY: preserve(),
			TODOIST_CLIENT_ID: preserve(),
			TODOIST_CLIENT_SECRET: preserve(),
		},
	})

	const web = service('web', {
		source: isProduction ? PRODUCTION_SOURCE : undefined,
		build: {
			builder: 'RAILPACK',
			// Ends by starting the built server and checking it (`apps/web/scripts/check-server.ts`).
			buildCommand: 'bun run --cwd apps/web build',
			watchPatterns: isProduction ? WEB_WATCH_PATTERNS : null,
		},
		// Railpack sets CI=true at run time, which turns off the server's graceful shutdown.
		start: 'env -u CI bun apps/web/.output/server/index.mjs',
		healthcheck: '/health',
		// Covers the server's 15 s graceful close (SERVER_SHUTDOWN_TIMEOUT) and its 5 s forced close before SIGKILL.
		deploy: { drainingSeconds: 30 },
		regions: { [REGION]: 1 },
		domains: [{ domain: new URL(hosts.app).host, port: PORT }],
		env: {
			PORT: String(PORT),
			SERVER_SHUTDOWN_TIMEOUT: '15',
			// Read at build time: the analytics environment, the blog's draft filter and the browser's API.
			APP_ENV: environment,
			VITE_API_URL: `https://${hosts.api}`,
			VITE_AUTH_COOKIE_PREFIX: hosts.cookiePrefix,
			// Server rendering reaches the API inside the environment, over plain http.
			API_INTERNAL_URL: `http://api.railway.internal:${PORT}`,
			API_PROXY_SECRET: api.env.API_PROXY_SECRET,
			VITE_POSTHOG_KEY: preserve(),
		},
	})

	return project('Soonlane', {
		resources: database ? [database, api, web] : [api, web],
	})
})
