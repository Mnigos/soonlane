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
	},
	staging: {
		api: 'api.staging.soonlane.com',
		app: 'https://staging.soonlane.com',
		trustedOrigins: 'https://staging.soonlane.com',
	},
} as const
const PORT = 8080
const REGION = 'europe-west4-drams3a'

function isKnownEnvironment(name: string): name is keyof typeof HOSTS {
	return Object.hasOwn(HOSTS, name)
}

export default defineRailway(ctx => {
	const environment = ctx.environment ?? ''

	if (!isKnownEnvironment(environment))
		throw new Error(`No Railway config for environment "${environment}"`)

	const hosts = HOSTS[environment]
	const isProduction = environment === 'production'
	// Production keeps Neon until its own Postgres takes over, so only staging declares one here.
	const database = isProduction
		? undefined
		: postgres('Postgres', { region: REGION })

	const api = service('api', {
		// Staging has no source, so only `railway up` from the deploy workflow deploys it.
		source: isProduction
			? github('Mnigos/soonlane', { branch: 'main', checkSuites: true })
			: undefined,
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
		deploy: { drainingSeconds: 10 },
		regions: { [REGION]: 1 },
		domains: [{ domain: hosts.api, port: PORT }],
		env: {
			PORT: String(PORT),
			APP_ENV: environment,
			API_URL: `https://${hosts.api}`,
			APP_URL: hosts.app,
			TRUSTED_ORIGINS: hosts.trustedOrigins,
			// Production holds Neon's direct URL, entered by hand.
			DATABASE_URL: database ? database.env.DATABASE_URL : preserve(),
			// Secrets, entered by hand per environment.
			AUTH_SECRET: preserve(),
			GOOGLE_CLIENT_ID: preserve(),
			GOOGLE_CLIENT_SECRET: preserve(),
			API_PROXY_SECRET: preserve(),
			ALLOWED_EMAILS: preserve(),
			POSTHOG_KEY: preserve(),
		},
	})

	return project('Soonlane', {
		resources: database ? [database, api] : [api],
	})
})
