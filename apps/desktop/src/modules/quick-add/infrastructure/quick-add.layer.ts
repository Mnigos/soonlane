import { dlopen, FFIType } from 'bun:ffi'
import { Effect, Layer, Option, Queue, Ref, Stream } from 'effect'
import { BrowserWindow, GlobalShortcut, Screen } from 'electrobun'
import { DesktopConfig } from '../../../platform/config/desktop.config'
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
import { openAppWindow } from '../../window/infrastructure/app-window.helper'
import { isQuickAddDone } from '../domain/quick-add-event.helper'
import { placeQuickAdd } from '../domain/quick-add-frame.helper'
import {
	QUICK_ADD_PATH,
	QUICK_ADD_SHORTCUT,
	QUICK_ADD_TITLE,
} from '../domain/quick-add.constants'

const APPLICATION_SERVICES =
	'/System/Library/Frameworks/ApplicationServices.framework/ApplicationServices'

// Electrobun's global NSEvent monitor sees keys in other apps only with Accessibility access.
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
		const { appUrl } = yield* DesktopConfig
		const scope = yield* Effect.scope
		const openWindowId = yield* Ref.make(Option.none<number>())

		const follow = Effect.fn('QuickAdd.follow')(function* (
			window: BrowserWindow
		) {
			const webviewEvents = (name: string) =>
				electrobunEvents(`${name}-${window.webview.id}`)

			yield* followNavigation(webviewEvents)
			yield* handleEvents(webviewEvents('host-message'), event =>
				isQuickAddDone(event) ? Effect.sync(() => window.close()) : Effect.void
			)
			yield* Stream.runHead(electrobunEvents(`close-${window.id}`))
		}, Effect.scoped)

		const create = Effect.gen(function* () {
			const window = yield* Effect.sync(() => {
				const created = openAppWindow(appUrl, {
					title: QUICK_ADD_TITLE,
					url: new URL(QUICK_ADD_PATH, appUrl).href,
					frame: placeQuickAdd(
						Screen.getAllDisplays(),
						Screen.getCursorScreenPoint()
					),
					titleBarStyle: 'hidden',
					styleMask: { Resizable: false, Miniaturizable: false },
				})

				created.setAlwaysOnTop(true)

				return created
			})

			yield* Ref.set(openWindowId, Option.some(window.id))
			yield* Effect.forkIn(follow(window), scope)
		})

		// Electrobun forgets a closed window, so the next press opens a new one.
		const open = Ref.get(openWindowId).pipe(
			Effect.map(Option.flatMapNullishOr(BrowserWindow.getById)),
			Effect.flatMap(
				Option.match({
					onSome: window => Effect.sync(() => window.activate()),
					onNone: () => create,
				})
			),
			Effect.withSpan('QuickAdd.open')
		)

		const menuPresses = electrobunEvents('application-menu-clicked').pipe(
			Stream.filter(event => readMenuAction(event) === QUICK_ADD_ACTION)
		)

		yield* handleEvents(Stream.merge(shortcutPresses, menuPresses), () => open)
	})
)
