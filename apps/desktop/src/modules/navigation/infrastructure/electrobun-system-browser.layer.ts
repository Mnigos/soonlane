import { Effect, Layer } from 'effect'
import { Utils } from 'electrobun'
import { SystemBrowser } from '../application/system-browser.port'

export const ElectrobunSystemBrowserLive = Layer.succeed(
	SystemBrowser,
	SystemBrowser.of({
		open: url => Effect.sync(() => Utils.openExternal(url.href)),
	})
)
