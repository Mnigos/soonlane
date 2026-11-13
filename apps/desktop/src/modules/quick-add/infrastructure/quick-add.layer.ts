import { APP_PATHS } from '@soonlane/app/app-paths'
import { Effect, Layer, Option, Queue, Ref, Stream } from 'effect'
import { BrowserWindow, Screen } from 'electrobun'
import {
	electrobunEvents,
	handleEvents,
} from '../../../platform/electrobun/electrobun-events.helper'
import {
	HOT_KEY_MODIFIERS,
	registerHotKey,
	SPACE_KEY_CODE,
} from '../../../platform/macos/carbon-hot-key.helper'
import { readMenuAction } from '../../menu/domain/menu-event.helper'
import { QUICK_ADD_ACTION } from '../../menu/domain/menu.constants'
import { followNavigation } from '../../navigation/infrastructure/navigation-events.layer'
import { DesktopSession } from '../../sign-in/application/desktop-session.service'
import { MainWindow } from '../../window/application/main-window.port'
import { openAppWindow } from '../../window/infrastructure/app-window.helper'
import {
	isQuickAddDone,
	readSuggestionsOpen,
} from '../domain/quick-add-event.helper'
import { placeQuickAdd } from '../domain/quick-add-frame.helper'
import {
	QUICK_ADD_SIZE,
	QUICK_ADD_SUGGESTIONS_HEIGHT,
	QUICK_ADD_TITLE,
} from '../domain/quick-add.constants'

/** Grows the window while the "@" suggestions are open, keeping its top edge. */
function fitSuggestions(window: BrowserWindow, isOpen: boolean) {
	const { x, y, width } = window.getFrame()

	window.setFrame(
		x,
		y,
		width,
		isOpen ? QUICK_ADD_SUGGESTIONS_HEIGHT : QUICK_ADD_SIZE.height
	)
}

/** Presses of ⌥Space, which macOS hands only to this app; when another app holds it, a warning and no presses. */
const shortcutPresses = Stream.callback<undefined>(queue =>
	Effect.gen(function* () {
		const unregister = yield* Effect.acquireRelease(
			Effect.sync(() =>
				registerHotKey(SPACE_KEY_CODE, HOT_KEY_MODIFIERS.option, () => {
					Queue.offerUnsafe(queue, undefined)
				})
			),
			release => Effect.sync(() => release?.())
		)

		if (!unregister)
			yield* Effect.logWarning('Could not register the Quick Add shortcut')
	})
)

export const QuickAddLive = Layer.effectDiscard(
	Effect.gen(function* () {
		const scope = yield* Effect.scope
		const session = yield* DesktopSession
		const mainWindow = yield* MainWindow
		const openWindowId = yield* Ref.make(Option.none<number>())

		const follow = Effect.fn('QuickAdd.follow')(function* (
			window: BrowserWindow,
			pageMessages: Stream.Stream<unknown>
		) {
			yield* followNavigation(name =>
				electrobunEvents(`${name}-${window.webview.id}`)
			)
			yield* handleEvents(pageMessages, message => {
				if (isQuickAddDone(message)) return Effect.sync(() => window.close())

				const isOpen = readSuggestionsOpen(message)

				return isOpen === undefined
					? Effect.void
					: Effect.sync(() => fitSuggestions(window, isOpen))
			})
			yield* Stream.runHead(electrobunEvents(`close-${window.id}`))
		})

		// The window lives in the fiber that follows it, so its page hears session changes until it closes.
		const create = Effect.gen(function* () {
			const { window, pageMessages } = yield* openAppWindow(
				APP_PATHS.quickAdd,
				{
					title: QUICK_ADD_TITLE,
					frame: placeQuickAdd(
						Screen.getAllDisplays(),
						Screen.getCursorScreenPoint()
					),
					titleBarStyle: 'hidden',
					styleMask: { Resizable: false, Miniaturizable: false },
				}
			)

			window.setAlwaysOnTop(true)
			yield* Ref.set(openWindowId, Option.some(window.id))
			yield* follow(window, pageMessages)
		}).pipe(Effect.scoped, Effect.forkIn(scope))

		// Electrobun forgets a closed window, so the next press opens a new one.
		const openQuickAdd = Ref.get(openWindowId).pipe(
			Effect.map(Option.flatMapNullishOr(BrowserWindow.getById)),
			Effect.flatMap(
				Option.match({
					onSome: window => Effect.sync(() => window.activate()),
					onNone: () => create,
				})
			)
		)
		// Signed out, the main window's sign-in screen comes forward instead.
		const open = session.token.pipe(
			Effect.flatMap(token =>
				Option.isSome(token) ? openQuickAdd : mainWindow.activate
			),
			Effect.withSpan('QuickAdd.open')
		)

		const menuPresses = electrobunEvents('application-menu-clicked').pipe(
			Stream.filter(event => readMenuAction(event) === QUICK_ADD_ACTION)
		)

		yield* handleEvents(Stream.merge(shortcutPresses, menuPresses), () => open)
	})
)
