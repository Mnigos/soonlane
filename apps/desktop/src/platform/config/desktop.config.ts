import { Config, ConfigProvider, Context, Layer, Schema } from 'effect'

const webOriginSchema = Schema.URLFromString.check(
	Schema.makeFilter(
		url =>
			url.protocol === 'https:' ||
			url.protocol === 'http:' ||
			'APP_URL and API_URL must be http or https URLs'
	)
)

export class DesktopConfig extends Context.Service<
	DesktopConfig,
	{
		/** The web app, where the browser signs in and where links to the public site and the Todoist import go. */
		readonly appUrl: URL
		/** The API, which the main process calls to trade a sign-in code for a token and to revoke it. */
		readonly apiUrl: URL
	}
>()('soonlane/DesktopConfig') {}

/**
 * The build inlines `process.env.APP_URL` and `process.env.API_URL` (`define` in
 * electrobun.config.ts), because an app opened from Finder gets no environment.
 */
export const DesktopConfigLive = Layer.effect(
	DesktopConfig,
	Config.all({
		appUrl: Config.schema(webOriginSchema, 'APP_URL'),
		apiUrl: Config.schema(webOriginSchema, 'API_URL'),
	}).parse(
		ConfigProvider.fromEnvRecord({
			APP_URL: process.env.APP_URL,
			API_URL: process.env.API_URL,
		})
	)
)
