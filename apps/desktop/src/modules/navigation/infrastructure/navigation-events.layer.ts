import { Effect, Layer, type Stream } from 'effect'
import { handleEvents } from '../../../platform/electrobun/electrobun-events.helper'
import {
	MainWindow,
	type WebviewEventName,
} from '../../window/application/main-window.port'
import { Navigation } from '../application/navigation.service'
import {
	readBlockedNavigationUrl,
	readNewWindowUrl,
} from '../domain/navigation-event.helper'

/** Applies the navigation rules' follow-ups to a window's webview until the enclosing scope closes. */
export const followNavigation = Effect.fn('Navigation.follow')(function* (
	webviewEvents: (name: WebviewEventName) => Stream.Stream<unknown>
) {
	const navigation = yield* Navigation

	yield* handleEvents(webviewEvents('new-window-open'), event => {
		const href = readNewWindowUrl(event)

		return href ? navigation.openLink(href) : Effect.void
	})

	yield* handleEvents(webviewEvents('will-navigate'), event => {
		const href = readBlockedNavigationUrl(event)

		return href ? navigation.leaveApp(href) : Effect.void
	})
})

export const NavigationEventsLive = Layer.effectDiscard(
	Effect.gen(function* () {
		const mainWindow = yield* MainWindow

		yield* followNavigation(mainWindow.webviewEvents)
	})
)
