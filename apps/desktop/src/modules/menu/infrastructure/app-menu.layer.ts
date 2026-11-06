import { Effect, Layer } from 'effect'
import { ApplicationMenu } from 'electrobun'
import {
	electrobunEvents,
	handleEvents,
} from '../../../platform/electrobun/electrobun-events.helper'
import { MainWindow } from '../../window/application/main-window.port'
import { readMenuAction } from '../domain/menu-event.helper'
import { RELOAD_ACTION } from '../domain/menu.constants'
import { APP_MENU } from './app-menu.constants'

export const AppMenuLive = Layer.effectDiscard(
	Effect.gen(function* () {
		const mainWindow = yield* MainWindow

		yield* Effect.sync(() => ApplicationMenu.setApplicationMenu(APP_MENU))
		yield* handleEvents(electrobunEvents('application-menu-clicked'), event =>
			readMenuAction(event) === RELOAD_ACTION ? mainWindow.reload : Effect.void
		)
	})
)
