import { Context, Effect, Layer } from 'effect'
import { DesktopConfig } from '../../../platform/config/desktop.config'
import { MainWindow } from '../../window/application/main-window.port'
import { resolveLink } from '../domain/navigation.helper'
import { SystemBrowser } from './system-browser.port'

export class Navigation extends Context.Service<
	Navigation,
	{
		/** A new-window request: the app's own pages load in the window, other links go to the system browser. */
		readonly openLink: (href: string) => Effect.Effect<void>
		/** A navigation the rules blocked: it can only leave the app, so it goes to the system browser or nowhere. */
		readonly leaveApp: (href: string) => Effect.Effect<void>
	}
>()('soonlist/Navigation') {}

export const NavigationLive = Layer.effect(
	Navigation,
	Effect.gen(function* () {
		const { appUrl } = yield* DesktopConfig
		const mainWindow = yield* MainWindow
		const systemBrowser = yield* SystemBrowser

		// Logs leave the URL out: links can carry tokens.
		const openInBrowser = Effect.fn('Navigation.openInBrowser')(function* (
			url: URL
		) {
			if (!(yield* systemBrowser.open(url)))
				yield* Effect.logWarning('The system browser did not open a link')
		})

		return Navigation.of({
			openLink: Effect.fn('Navigation.openLink')(function* (href) {
				const target = resolveLink(href, appUrl)

				if (target?.opensIn === 'window') yield* mainWindow.load(target.url)
				if (target?.opensIn === 'browser') yield* openInBrowser(target.url)
			}),
			leaveApp: Effect.fn('Navigation.leaveApp')(function* (href) {
				const target = resolveLink(href, appUrl)

				if (target?.opensIn === 'browser') yield* openInBrowser(target.url)
			}),
		})
	})
)
