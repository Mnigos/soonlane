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

		yield* handleEvents(mainWindow.webviewEvents('new-window-open'), event => {
			const href = readNewWindowUrl(event)

			return href ? navigation.openLink(href) : Effect.void
		})

		yield* handleEvents(mainWindow.webviewEvents('will-navigate'), event => {
			const href = readBlockedNavigationUrl(event)

			return href ? navigation.leaveApp(href) : Effect.void
		})
	})
)
