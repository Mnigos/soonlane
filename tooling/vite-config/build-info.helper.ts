import { existsSync, readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'
import type { AppEnvironment } from '@soonlane/analytics'
import versionFile from '../../version.json' with { type: 'json' }

const SHORT_SHA_LENGTH = 7
const APP_ENVIRONMENTS = Object.keys({
	production: true,
	staging: true,
	development: true,
} satisfies Record<AppEnvironment, true>)

function isAppEnvironment(name: string): name is AppEnvironment {
	return APP_ENVIRONMENTS.includes(name)
}

/** GitHub deploys on Railway set RAILWAY_GIT_COMMIT_SHA; `railway up` uploads no git metadata, so the staging deploy writes the app's `commit.env`. */
function readCommit(appDirectory: URL) {
	const commitFile = new URL('commit.env', appDirectory)

	return (
		process.env.RAILWAY_GIT_COMMIT_SHA ||
		(existsSync(commitFile)
			? parseEnv(readFileSync(commitFile, 'utf-8')).APP_COMMIT
			: undefined) ||
		'dev'
	).slice(0, SHORT_SHA_LENGTH)
}

/**
 * The build's `APP_ENV` (`development` when unset; anything else fails the build) and the `define` entries both
 * browser apps inline: the product version from version.json, which the release PR writes, the deployed commit and the environment.
 */
export function readBuildInfo(appDirectory: URL) {
	const environment = process.env.APP_ENV || 'development'

	if (!isAppEnvironment(environment))
		throw new Error(
			`APP_ENV must be one of ${APP_ENVIRONMENTS.join(', ')}, not "${environment}"`
		)

	return {
		environment,
		define: {
			'import.meta.env.APP_VERSION': JSON.stringify(versionFile.version),
			'import.meta.env.APP_COMMIT': JSON.stringify(readCommit(appDirectory)),
			'import.meta.env.APP_ENVIRONMENT': JSON.stringify(environment),
		},
	}
}
