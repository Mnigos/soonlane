import { Effect, Layer } from 'effect'
import { handleEvents } from '../../../platform/electrobun/electrobun-events.helper'
import { MainWindow } from '../../window/application/main-window.port'
import { Navigation } from '../application/navigation.service'
import {
	readBlockedNavigationUrl,
	readNewWindowUrl,
} from '../domain/navigation-event.helper'

export const NavigationEventsLive = Layer.effectDiscard(
	Effect.gen(function* () {
		const mainWindow = yield* MainWindow
		const navigation = yield* Navigation

		// target=_blank, window.open and Cmd+click: other sites go to the system browser, the app stays in this window.
		yield* handleEvents(mainWindow.webviewEvents('new-window-open'), event => {
			const href = readNewWindowUrl(event)

			return href ? navigation.openLink(href) : Effect.void
		})

		// The rules cancel top-level navigations to other origins (links, redirects, location changes); they open in the browser.
		yield* handleEvents(mainWindow.webviewEvents('will-navigate'), event => {
			const href = readBlockedNavigationUrl(event)

			return href ? navigation.leaveApp(href) : Effect.void
		})
	})
)
