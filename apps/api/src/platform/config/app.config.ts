import { MIN_SECRET_LENGTH, parseAllowedEmails } from '@soonlane/auth'
import {
	Config,
	ConfigProvider,
	Context,
	Effect,
	Layer,
	Option,
	type Redacted,
	Schema,
	SchemaTransformation,
} from 'effect'
import versionFile from '../../../../../version.json' with { type: 'json' }

const originsSchema = Schema.String.pipe(
	Schema.decodeTo(
		Schema.Array(Schema.URLFromString),
		SchemaTransformation.transform<readonly string[], string>({
			decode: value => value.split(','),
			encode: origins => origins.join(','),
		})
	)
)

const allowedEmailsSchema = Schema.String.check(
	Schema.makeFilter(
		value =>
			value === '' ||
			parseAllowedEmails(value).length > 0 ||
			'ALLOWED_EMAILS must list at least one address, or be unset'
	)
)

const authSecretSchema = Schema.String.check(
	Schema.makeFilter(
		value =>
			value.length >= MIN_SECRET_LENGTH ||
			`AUTH_SECRET must be at least ${MIN_SECRET_LENGTH} characters long`
	)
)

export class AppConfig extends Context.Service<
	AppConfig,
	{
		readonly port: number
		readonly environment: string
		readonly commit: string
		readonly version: string
		readonly baseUrl: string
		readonly appUrl: string
		readonly trustedOrigins: readonly string[]
		readonly cookiePrefix: string
		readonly cookieDomain?: string
		readonly databaseUrl: Redacted.Redacted
		readonly authSecret: Redacted.Redacted
		readonly allowedEmails: readonly string[]
		readonly googleClientId: string
		readonly googleClientSecret: Redacted.Redacted
		readonly proxySecret: Redacted.Redacted
		readonly posthogKey?: string
	}
>()('soonlane/AppConfig') {}

function originConfig(name: string) {
	return Config.url(name).pipe(Config.map(url => url.origin))
}

/** Every setting but `ALLOWED_EMAILS`, `AUTH_COOKIE_DOMAIN` and `POSTHOG_KEY` is required: a missing or malformed variable stops the start with its name. */
const appConfig = Config.all({
	port: Config.port('PORT'),
	environment: Config.nonEmptyString('APP_ENV'),
	// GitHub deploys get the commit from Railway; `railway up` deploys get it from the bundle.
	commit: Config.nonEmptyString('RAILWAY_GIT_COMMIT_SHA').pipe(
		Config.orElse(() => Config.nonEmptyString('APP_COMMIT'))
	),
	baseUrl: originConfig('API_URL'),
	// The web app's origin: the target of Better Auth's errors and the host of event links; calendar subscription links use API_URL.
	appUrl: originConfig('APP_URL'),
	trustedOrigins: Config.schema(originsSchema, 'TRUSTED_ORIGINS').pipe(
		Config.map(urls => urls.map(url => url.origin))
	),
	cookiePrefix: Config.nonEmptyString('AUTH_COOKIE_PREFIX'),
	cookieDomain: Config.option(Config.nonEmptyString('AUTH_COOKIE_DOMAIN')).pipe(
		Config.map(Option.getOrUndefined)
	),
	databaseUrl: Config.redacted('DATABASE_URL'),
	authSecret: Config.schema(Schema.Redacted(authSecretSchema), 'AUTH_SECRET'),
	allowedEmails: Config.schema(allowedEmailsSchema, 'ALLOWED_EMAILS').pipe(
		Config.withDefault(''),
		Config.map(parseAllowedEmails)
	),
	googleClientId: Config.nonEmptyString('GOOGLE_CLIENT_ID'),
	googleClientSecret: Config.redacted('GOOGLE_CLIENT_SECRET'),
	proxySecret: Config.redacted('API_PROXY_SECRET'),
	posthogKey: Config.option(Config.nonEmptyString('POSTHOG_KEY')).pipe(
		Config.map(Option.getOrUndefined)
	),
})

/**
 * `railway up` uploads no git metadata, so `bun build` inlines `process.env.APP_COMMIT` from `commit.env`,
 * which the staging deploy workflow writes into the upload. The build unsets an inherited `APP_COMMIT`, which Bun
 * would prefer over the file, and the bundle is read ahead of the environment, so the reported commit always
 * belongs to the running bundle.
 */
const bundleProvider = ConfigProvider.fromEnvRecord({
	APP_COMMIT: process.env.APP_COMMIT,
})

export const AppConfigLive = Layer.effect(
	AppConfig,
	Effect.gen(function* () {
		return { ...(yield* appConfig), version: versionFile.version }
	}).pipe(
		Effect.provideService(
			ConfigProvider.ConfigProvider,
			ConfigProvider.orElse(bundleProvider, ConfigProvider.fromEnv())
		)
	)
)
