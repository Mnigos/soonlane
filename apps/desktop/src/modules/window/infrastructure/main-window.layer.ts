import { Effect, Layer, Option, Ref, Stream } from 'effect'
import { BrowserWindow, Screen } from 'electrobun'
import { DesktopConfig } from '../../../platform/config/desktop.config'
import {
	electrobunEvents,
	listen,
} from '../../../platform/electrobun/electrobun-events.helper'
import { getNavigationRules } from '../../navigation/domain/navigation.helper'
import { FrameStore } from '../application/frame-store.port'
import { MainWindow } from '../application/main-window.port'
import { applyFrameEvent, restoreFrame } from '../domain/window-frame.helper'
import { FRAME_SAVE_DELAY, WINDOW_TITLE } from '../domain/window.constants'
import { SHELL_PRELOAD } from './shell-preload.constants'

/** Saves the frame once resizes and moves pause, and right away when the window closes. */
const persistFrame = Effect.fn('MainWindow.persistFrame')(function* (
	window: BrowserWindow
) {
	const frameStore = yield* FrameStore
	// Resize and move events carry the new frame, so closing never has to read a window that is going away.
	const latest = yield* Ref.make(window.getFrame())
	const save = Effect.fn('MainWindow.saveFrame')(function* () {
		yield* Ref.get(latest).pipe(
			Effect.flatMap(frameStore.save),
			Effect.catch(error =>
				Effect.logWarning('Could not save the window frame', error.operation)
			)
		)
	})

	yield* Stream.merge(
		electrobunEvents(`resize-${window.id}`),
		electrobunEvents(`move-${window.id}`)
	).pipe(
		Stream.mapEffect(event =>
			Ref.update(latest, frame => applyFrameEvent(frame, event))
		),
		Stream.debounce(FRAME_SAVE_DELAY),
		Stream.runForEach(save),
		Effect.forkScoped
	)

	// The app quits right after its last window closes, so this save runs inside the close callback.
	const context = yield* Effect.context()

	yield* listen(`close-${window.id}`, () => Effect.runSyncWith(context)(save()))
})

export const MainWindowLive = Layer.effect(
	MainWindow,
	Effect.gen(function* () {
		const { appUrl } = yield* DesktopConfig
		const saved = yield* (yield* FrameStore).load
		const window = yield* Effect.sync(() => {
			const created = new BrowserWindow({
				title: WINDOW_TITLE,
				url: appUrl.href,
				frame: restoreFrame(
					Option.getOrUndefined(saved),
					Screen.getAllDisplays().map(({ workArea }) => workArea)
				),
				titleBarStyle: 'hiddenInset',
				preload: SHELL_PRELOAD,
				renderer: 'native',
			})

			// Electrobun 2.0.6 ignores the navigationRules window option for the main view, so the rules are set on the view.
			created.webview.setNavigationRules(getNavigationRules(appUrl))

			return created
		})
		const { webview } = window

		yield* persistFrame(window)

		return MainWindow.of({
			load: url => Effect.sync(() => webview.loadURL(url.href)),
			reload: Effect.sync(() => webview.executeJavascript('location.reload()')),
			webviewEvents: name => electrobunEvents(`${name}-${webview.id}`),
		})
	})
)
