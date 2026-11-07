import { parseAllowedEmails } from '@soonlane/auth'
import { Config, Context, Layer, Option, Redacted, Schema } from 'effect'
import {
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
		readonly baseUrl: string
		readonly trustedOrigins: readonly string[]
		readonly authSecret: Redacted.Redacted
		readonly allowedEmails: readonly string[]
		readonly googleClientId: string
		readonly googleClientSecret: string
		readonly oauthProxy: boolean
		readonly oauthProxySecret?: Redacted.Redacted
	}
>()('soonlane/AppConfig') {}

function optionalString(name: string) {
	return Config.option(Config.nonEmptyString(name)).pipe(
		Config.map(Option.getOrUndefined)
	)
}

export const AppConfigLive = Layer.effect(
	AppConfig,
	Config.all({
		databaseUrl: Config.string('DATABASE_URL').pipe(Config.withDefault('')),
		authUrl: optionalString('AUTH_URL'),
		vercelBranchUrl: optionalString('VERCEL_BRANCH_URL'),
		vercelUrl: optionalString('VERCEL_URL'),
		vercelEnv: optionalString('VERCEL_ENV'),
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
	}).pipe(
		Config.map(
			({ authUrl, vercelBranchUrl, vercelUrl, vercelEnv, ...settings }) => {
				const urls = { authUrl, vercelBranchUrl, vercelUrl }

				return {
					...settings,
					baseUrl: resolveBaseUrl(urls),
					trustedOrigins: resolveTrustedOrigins(urls),
					oauthProxy: usesOAuthProxy(vercelEnv),
				}
			}
		)
	)
)
