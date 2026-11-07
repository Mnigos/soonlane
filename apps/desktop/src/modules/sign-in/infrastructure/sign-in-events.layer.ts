import { Effect, Layer } from 'effect'
import { DesktopConfig } from '../../../platform/config/desktop.config'
import {
	electrobunEvents,
	handleEvents,
} from '../../../platform/electrobun/electrobun-events.helper'
import { readBlockedNavigationUrl } from '../../navigation/domain/navigation-event.helper'
import { MainWindow } from '../../window/application/main-window.port'
import { DesktopSignIn } from '../application/desktop-sign-in.service'
import { readOpenedUrl } from '../domain/sign-in-event.helper'
import { isSignInStart } from '../domain/sign-in.helper'

export const SignInEventsLive = Layer.effectDiscard(
	Effect.gen(function* () {
		const { appUrl } = yield* DesktopConfig
		const mainWindow = yield* MainWindow
		const signIn = yield* DesktopSignIn

		yield* handleEvents(mainWindow.webviewEvents('will-navigate'), event => {
			const href = readBlockedNavigationUrl(event)

			return href && isSignInStart(href, appUrl)
				? signIn.start(href)
				: Effect.void
		})

		// macOS delivers `soonlane://` links here only when the app is in /Applications.
		yield* handleEvents(electrobunEvents('open-url'), event => {
			const href = readOpenedUrl(event)

			return href ? signIn.complete(href) : Effect.void
		})
	})
)
