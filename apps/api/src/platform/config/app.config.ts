import { MIN_SECRET_LENGTH, parseAllowedEmails } from '@soonlane/auth'
import { APP_VERSION_PATTERN } from '@soonlane/contracts'
import {
	Config,
	ConfigProvider,
	Context,
	Effect,
	Layer,
	Option,
	Redacted,
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

interface OAuthClientConfig {
	readonly clientId: string
	readonly clientSecret: Redacted.Redacted
}

/** Where sign-in codes go: Resend's HTTP API (Railway's Hobby plan blocks SMTP), an SMTP server, or the log in development. */
export type EmailTransport =
	| { readonly kind: 'resend'; readonly apiKey: Redacted.Redacted }
	| { readonly kind: 'smtp'; readonly url: Redacted.Redacted }
	| { readonly kind: 'log' }

export interface EmailConfig {
	/** The sender, such as `Soonlane <code@mail.soonlane.com>`. */
	readonly from: string
	readonly transport: EmailTransport
}

export class AppConfig extends Context.Service<
	AppConfig,
	{
		readonly port: number
		readonly environment: string
		readonly commit: string
		readonly version: string
		readonly baseUrl: string
		readonly appUrl: string
		readonly landingUrl: string
		readonly trustedOrigins: readonly string[]
		readonly cookiePrefix: string
		readonly cookieDomain?: string
		readonly databaseUrl: Redacted.Redacted
		readonly authSecret: Redacted.Redacted
		readonly allowedEmails: readonly string[]
		/** Unset, nobody signs in with Google. */
		readonly google?: OAuthClientConfig
		/** Unset, nobody signs in with an email code, except in development, where the codes go to the log. */
		readonly email?: EmailConfig
		readonly proxySecret: Redacted.Redacted
		readonly posthogKey?: string
		/** A PostHog personal API key with `person:write`; unset, deleting an account leaves its PostHog person. */
		readonly posthogPersonalApiKey?: Redacted.Redacted
		/** The oldest desktop app version this API serves; unset, every version is. */
		readonly desktopMinimumVersion?: string
		/** The oldest iPhone and Android app version this API serves; unset, every version is. */
		readonly mobileMinimumVersion?: string
		readonly todoist?: OAuthClientConfig
		readonly linear?: OAuthClientConfig
	}
>()('soonlane/AppConfig') {}

function originConfig(name: string) {
	return Config.URL(name).pipe(Config.map(url => url.origin))
}

function configFailure(message: string) {
	return Config.fail(new ConfigProvider.SourceError({ message }))
}

function isLoopbackHost(hostname: string) {
	return (
		hostname === 'localhost' ||
		hostname.endsWith('.localhost') ||
		hostname === '[::1]' ||
		/^127\.\d+\.\d+\.\d+$/u.test(hostname)
	)
}

/** The API's origin, also the base of the MCP resource, which Better Auth's MCP plugin accepts only over HTTPS, or HTTP on a loopback host. */
const apiOriginConfig = Config.URL('API_URL').pipe(
	Config.flatMap(({ protocol, hostname, origin }) =>
		protocol === 'https:' || (protocol === 'http:' && isLoopbackHost(hostname))
			? Config.succeed(origin)
			: configFailure(
					'API_URL must be an https:// origin, or http:// on localhost'
				)
	)
)

/** An optional app version; a malformed one stops the start with the variable's name. */
function minimumVersionConfig(name: string) {
	return Config.option(
		Config.schema(
			Schema.String.check(
				Schema.makeFilter(
					value =>
						APP_VERSION_PATTERN.test(value) ||
						`${name} must be a version such as 0.3.0`
				)
			),
			name
		)
	).pipe(Config.map(Option.getOrUndefined))
}

/** Both variables of an OAuth client or neither: with one set, the other is read as required, so the start fails naming it. */
function oauthClientConfig(idName: string, secretName: string) {
	return Config.all({
		clientId: Config.option(Config.NonEmptyString(idName)),
		clientSecret: Config.option(Config.Redacted(secretName)),
	}).pipe(
		Config.flatMap(({ clientId, clientSecret }) =>
			Option.isNone(clientId) && Option.isNone(clientSecret)
				? Config.succeed(undefined)
				: Config.all({
						clientId: Config.NonEmptyString(idName),
						clientSecret: Config.Redacted(secretName),
					})
		)
	)
}

/** `code@mail.soonlane.com` or `Soonlane <code@mail.soonlane.com>`, the two shapes Resend and SMTP accept. */
const SENDER_PATTERN =
	/^(?:[^<>]+ <[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+>|[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+)$/u

/** Nodemailer takes any string and falls back to localhost, so a typo would advertise email sign-in that never sends. */
function isSmtpUrl(value: string) {
	const url = URL.parse(value)

	return (
		(url?.protocol === 'smtp:' || url?.protocol === 'smtps:') &&
		url.hostname !== ''
	)
}

/** `EMAIL_FROM` with exactly one of `RESEND_API_KEY` and `SMTP_URL`, or none of the three; anything in between stops the start. */
const emailConfig = Config.all({
	from: Config.option(
		Config.schema(
			Schema.String.check(
				Schema.makeFilter(
					value =>
						SENDER_PATTERN.test(value) ||
						'EMAIL_FROM must be an address, or a name and an address in angle brackets'
				)
			),
			'EMAIL_FROM'
		)
	),
	resendApiKey: Config.option(Config.Redacted('RESEND_API_KEY')),
	smtpUrl: Config.option(Config.Redacted('SMTP_URL')),
}).pipe(
	Config.flatMap(({ from, resendApiKey, smtpUrl }) => {
		const transports: EmailTransport[] = [
			...Option.toArray(resendApiKey).map(apiKey => ({
				kind: 'resend' as const,
				apiKey,
			})),
			...Option.toArray(smtpUrl).map(url => ({ kind: 'smtp' as const, url })),
		]
		const [transport, ...others] = transports

		if (Option.isSome(smtpUrl) && !isSmtpUrl(Redacted.value(smtpUrl.value)))
			return configFailure(
				'SMTP_URL must be an smtp:// or smtps:// URL with a host'
			)

		if (Option.isNone(from) && !transport) return Config.succeed(undefined)
		if (Option.isNone(from) || !transport || others.length > 0)
			return configFailure(
				'Set EMAIL_FROM with exactly one of RESEND_API_KEY and SMTP_URL, or none of them'
			)

		return Config.succeed({ from: from.value, transport })
	})
)

/** Every setting but `ALLOWED_EMAILS`, `AUTH_COOKIE_DOMAIN`, the PostHog keys, the Google, Todoist and Linear pairs, the email group and the minimum app versions is required: a missing or malformed variable stops the start with its name, and so does a server with no way to sign in. */
const appConfig = Config.all({
	port: Config.Port('PORT'),
	environment: Config.NonEmptyString('APP_ENV'),
	// GitHub deploys get the commit from Railway; `railway up` deploys get it from the bundle.
	commit: Config.NonEmptyString('RAILWAY_GIT_COMMIT_SHA').pipe(
		Config.orElse(() => Config.NonEmptyString('APP_COMMIT'))
	),
	baseUrl: apiOriginConfig,
	// The web app's origin: the target of Better Auth's errors and the host of event links; calendar subscription links use API_URL.
	appUrl: originConfig('APP_URL'),
	// The landing's origin, which may send PostHog events through `/ingest`.
	landingUrl: originConfig('LANDING_URL'),
	trustedOrigins: Config.schema(originsSchema, 'TRUSTED_ORIGINS').pipe(
		Config.map(urls => urls.map(url => url.origin))
	),
	cookiePrefix: Config.NonEmptyString('AUTH_COOKIE_PREFIX'),
	cookieDomain: Config.option(Config.NonEmptyString('AUTH_COOKIE_DOMAIN')).pipe(
		Config.map(Option.getOrUndefined)
	),
	databaseUrl: Config.Redacted('DATABASE_URL'),
	authSecret: Config.schema(Schema.Redacted(authSecretSchema), 'AUTH_SECRET'),
	allowedEmails: Config.schema(allowedEmailsSchema, 'ALLOWED_EMAILS').pipe(
		Config.withDefault(''),
		Config.map(parseAllowedEmails)
	),
	google: oauthClientConfig('GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'),
	email: emailConfig,
	proxySecret: Config.Redacted('API_PROXY_SECRET'),
	posthogKey: Config.option(Config.NonEmptyString('POSTHOG_KEY')).pipe(
		Config.map(Option.getOrUndefined)
	),
	posthogPersonalApiKey: Config.option(
		Config.Redacted('POSTHOG_PERSONAL_API_KEY')
	).pipe(Config.map(Option.getOrUndefined)),
	todoist: oauthClientConfig('TODOIST_CLIENT_ID', 'TODOIST_CLIENT_SECRET'),
	linear: oauthClientConfig('LINEAR_CLIENT_ID', 'LINEAR_CLIENT_SECRET'),
	desktopMinimumVersion: minimumVersionConfig('DESKTOP_MINIMUM_VERSION'),
	mobileMinimumVersion: minimumVersionConfig('MOBILE_MINIMUM_VERSION'),
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

/** In development without email settings, sign-in codes go to the log, so a fresh checkout signs in with neither Google nor a mail provider. */
const signInConfig = appConfig.pipe(
	Config.map(config =>
		config.email || config.environment !== 'development'
			? config
			: {
					...config,
					email: {
						from: 'Soonlane <dev@localhost>',
						transport: { kind: 'log' as const },
					},
				}
	),
	Config.flatMap(config =>
		config.google || config.email
			? Config.succeed(config)
			: configFailure(
					'Set up a way to sign in: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, or EMAIL_FROM with RESEND_API_KEY or SMTP_URL'
				)
	)
)

export const AppConfigLive = Layer.effect(
	AppConfig,
	Effect.gen(function* () {
		return { ...(yield* signInConfig), version: versionFile.version }
	}).pipe(
		Effect.provideService(
			ConfigProvider.ConfigProvider,
			ConfigProvider.orElse(bundleProvider, ConfigProvider.fromEnv())
		)
	)
)
