import { defineRailway, github, preserve, project, service } from 'railway/iac'

/** Owns only what this file declares, so applying it never touches resources made elsewhere, such as Postgres. */
export const partial = 'soonlane'

const HOSTS = {
	production: {
		api: 'api.soonlane.com',
		trustedOrigins: 'https://soonlane.com',
	},
	staging: {
		api: 'api.staging.soonlane.com',
		trustedOrigins: 'https://staging.soonlane.com',
	},
} as const
const PORT = 8080

function isKnownEnvironment(name: string): name is keyof typeof HOSTS {
	return Object.hasOwn(HOSTS, name)
}

export default defineRailway(ctx => {
	const environment = ctx.environment ?? ''

	if (!isKnownEnvironment(environment))
		throw new Error(`No Railway config for environment "${environment}"`)

	const hosts = HOSTS[environment]
	const isProduction = environment === 'production'

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
						'/tooling/typescript-config/**',
						'/package.json',
						'/bun.lock',
						'/bunfig.toml',
					]
				: null,
		},
		start: 'bun apps/api/dist/main.js',
		healthcheck: '/health',
		deploy: { drainingSeconds: 10 },
		regions: { 'europe-west4-drams3a': 1 },
		domains: [{ domain: hosts.api, port: PORT }],
		env: {
			PORT: String(PORT),
			APP_ENV: environment,
			API_URL: `https://${hosts.api}`,
			TRUSTED_ORIGINS: hosts.trustedOrigins,
			// The staging deploy workflow sets it, because `railway up` uploads no git metadata.
			APP_COMMIT: preserve(),
		},
	})

	return project('Soonlane', { resources: [api] })
})
