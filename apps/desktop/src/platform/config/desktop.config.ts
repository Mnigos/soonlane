import { Config, ConfigProvider, Context, Layer, Schema } from 'effect'

// The app's origin decides what may load in the window, so it has to be a web origin; file: and custom schemes have none.
const appUrlSchema = Schema.URLFromString.check(
	Schema.makeFilter(
		url =>
			url.protocol === 'https:' ||
			url.protocol === 'http:' ||
			'APP_URL must be an http or https URL'
	)
)

export class DesktopConfig extends Context.Service<
	DesktopConfig,
	{
		readonly appUrl: URL
	}
>()('soonlane/DesktopConfig') {}

/**
 * The hosted web app the window loads. The build inlines `process.env.APP_URL` (`define` in
 * electrobun.config.ts), because an app opened from Finder gets no environment.
 */
export const DesktopConfigLive = Layer.effect(
	DesktopConfig,
	Config.schema(appUrlSchema, 'APP_URL')
		.pipe(Config.map(appUrl => ({ appUrl })))
		.parse(ConfigProvider.fromEnvRecord({ APP_URL: process.env.APP_URL }))
)
