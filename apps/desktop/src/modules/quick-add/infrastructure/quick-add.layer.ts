import { dlopen, FFIType } from 'bun:ffi'
import { APP_PATHS } from '@soonlane/app/app-paths'
import { Effect, Layer, Option, Queue, Ref, Stream } from 'effect'
import { BrowserWindow, GlobalShortcut, Screen } from 'electrobun'
import {
	electrobunEvents,
	handleEvents,
} from '../../../platform/electrobun/electrobun-events.helper'
import {
	getClass,
	getSelector,
	messageSender,
	utf8,
} from '../../../platform/macos/objc.helper'
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
	QUICK_ADD_SHORTCUT,
	QUICK_ADD_SIZE,
	QUICK_ADD_SUGGESTIONS_HEIGHT,
	QUICK_ADD_TITLE,
} from '../domain/quick-add.constants'

const APPLICATION_SERVICES =
	'/System/Library/Frameworks/ApplicationServices.framework/ApplicationServices'

/** Electrobun's NSEvent monitor sees keys in other apps only with Accessibility access; when missing, macOS asks for it. */
function requestAccessibility() {
	const { AXIsProcessTrustedWithOptions } = dlopen(APPLICATION_SERVICES, {
		AXIsProcessTrustedWithOptions: {
			args: [FFIType.ptr],
			returns: FFIType.bool,
		},
	}).symbols
	const sendString = messageSender([FFIType.cstring], FFIType.ptr)
	const sendBool = messageSender([FFIType.bool], FFIType.ptr)
	const sendPair = messageSender([FFIType.ptr, FFIType.ptr], FFIType.ptr)

	return AXIsProcessTrustedWithOptions(
		sendPair(
			getClass('NSDictionary'),
			getSelector('dictionaryWithObject:forKey:'),
			sendBool(getClass('NSNumber'), getSelector('numberWithBool:'), true),
			sendString(
				getClass('NSString'),
				getSelector('stringWithUTF8String:'),
				utf8('AXTrustedCheckOptionPrompt')
			)
		)
	)
}

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

/** Presses of the Quick Add shortcut; when another app holds it, a warning and no presses. */
const shortcutPresses = Stream.callback<undefined>(queue =>
	Effect.gen(function* () {
		const registered = yield* Effect.acquireRelease(
			Effect.sync(() =>
				GlobalShortcut.register(QUICK_ADD_SHORTCUT, () => {
					Queue.offerUnsafe(queue, undefined)
				})
			),
			isRegistered =>
				Effect.sync(
					() => isRegistered && GlobalShortcut.unregister(QUICK_ADD_SHORTCUT)
				)
		)

		if (!registered)
			yield* Effect.logWarning('Could not register the Quick Add shortcut')
		else if (!(yield* Effect.sync(requestAccessibility)))
			yield* Effect.logWarning(
				'The Quick Add shortcut works in other apps once Soonlane has Accessibility access'
			)
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
