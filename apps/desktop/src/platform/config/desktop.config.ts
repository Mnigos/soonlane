import { Config, Context, Layer, Schema } from 'effect'

const PRODUCTION_APP_URL = 'https://soonlane.com'

// The app's origin decides what may load in the window, so it has to be a web origin; file: and custom schemes have none.
const appUrlSchema = Schema.URLFromString.check(
	Schema.makeFilter(
		url =>
			url.protocol === 'https:' ||
			url.protocol === 'http:' ||
			'SOONLANE_URL must be an http or https URL'
	)
)

export class DesktopConfig extends Context.Service<
	DesktopConfig,
	{
		readonly appUrl: URL
	}
>()('soonlane/DesktopConfig') {}

/** The hosted web app the window loads; `bun run dev` points `SOONLANE_URL` at the local dev server. */
export const DesktopConfigLive = Layer.effect(
	DesktopConfig,
	Config.schema(appUrlSchema, 'SOONLANE_URL').pipe(
		Config.withDefault(new URL(PRODUCTION_APP_URL)),
		Config.map(appUrl => ({ appUrl }))
	)
)
