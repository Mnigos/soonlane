import { parseAllowedEmails } from '@soonlane/auth'
import {
	Config,
	Context,
	Effect,
	Layer,
	Option,
	Redacted,
	Schema,
} from 'effect'
import {
	LOCAL_APP_URL,
	resolveBaseUrl,
	resolveTrustedOrigins,
	usesOAuthProxy,
} from './app-url.helper'

const allowedEmailsSchema = Schema.String.check(
	Schema.makeFilter(
		value =>
			value === '' ||
			parseAllowedEmails(value).length > 0 ||
			'ALLOWED_EMAILS must list at least one address, or be unset'
	)
)

export class AppConfig extends Context.Service<
	AppConfig,
	{
		readonly databaseUrl: string
		readonly appUrl: string
		readonly baseUrl: string
		readonly trustedOrigins: readonly string[]
		readonly authSecret: Redacted.Redacted
		readonly allowedEmails: readonly string[]
		readonly googleClientId: string
		readonly googleClientSecret: string
		readonly oauthProxy: boolean
		readonly oauthProxySecret?: Redacted.Redacted
		readonly posthogKey?: string
	}
>()('soonlane/AppConfig') {}

function optionalString(name: string) {
	return Config.option(Config.nonEmptyString(name)).pipe(
		Config.map(Option.getOrUndefined)
	)
}

/** `APP_URL` is production's URL on every Vercel deployment, so it is required there; a local run falls back to the dev server. */
function appUrlConfig(vercelEnv: string | undefined) {
	const appUrl = Config.url('APP_URL').pipe(Config.map(url => url.origin))

	return usesOAuthProxy(vercelEnv)
		? appUrl
		: appUrl.pipe(Config.withDefault(LOCAL_APP_URL))
}

const settingsConfig = Config.all({
	databaseUrl: Config.string('DATABASE_URL').pipe(Config.withDefault('')),
	authSecret: Config.redacted('AUTH_SECRET').pipe(
		Config.withDefault(Redacted.make(''))
	),
	allowedEmails: Config.schema(allowedEmailsSchema, 'ALLOWED_EMAILS').pipe(
		Config.withDefault(''),
		Config.map(parseAllowedEmails)
	),
	googleClientId: Config.string('GOOGLE_CLIENT_ID').pipe(
		Config.withDefault('')
	),
	googleClientSecret: Config.string('GOOGLE_CLIENT_SECRET').pipe(
		Config.withDefault('')
	),
	oauthProxySecret: optionalString('OAUTH_PROXY_SECRET').pipe(
		Config.map(secret => (secret ? Redacted.make(secret) : undefined))
	),
	// Public by design: the browser bundle reads the same variable at build time.
	posthogKey: optionalString('VITE_POSTHOG_KEY'),
})

export const AppConfigLive = Layer.effect(
	AppConfig,
	Effect.gen(function* () {
		const vercelEnv = yield* optionalString('VERCEL_ENV')
		const urls = {
			appUrl: yield* appUrlConfig(vercelEnv),
			vercelEnv,
			vercelBranchUrl: yield* optionalString('VERCEL_BRANCH_URL'),
			vercelUrl: yield* optionalString('VERCEL_URL'),
		}
		const settings = yield* settingsConfig

		return {
			...settings,
			appUrl: urls.appUrl,
			baseUrl: resolveBaseUrl(urls),
			trustedOrigins: resolveTrustedOrigins(urls),
			oauthProxy: usesOAuthProxy(vercelEnv),
		}
	})
)
