import { Config, Context, Layer, Option } from 'effect'
import { resolveBaseUrl, resolveTrustedOrigins } from './app-url.helper'

export class AppConfig extends Context.Service<
	AppConfig,
	{
		readonly baseUrl: string
		readonly trustedOrigins: readonly string[]
		readonly version?: string
	}
>()('soonlist/AppConfig') {}

function optionalString(name: string) {
	return Config.option(Config.nonEmptyString(name)).pipe(
		Config.map(Option.getOrUndefined)
	)
}

export const AppConfigLive = Layer.effect(
	AppConfig,
	Config.all({
		authUrl: optionalString('AUTH_URL'),
		vercelBranchUrl: optionalString('VERCEL_BRANCH_URL'),
		vercelUrl: optionalString('VERCEL_URL'),
		version: optionalString('VERCEL_GIT_COMMIT_SHA'),
	}).pipe(
		Config.map(({ version, ...urls }) => ({
			baseUrl: resolveBaseUrl(urls),
			trustedOrigins: resolveTrustedOrigins(urls),
			version,
		}))
	)
)
