import { Effect, Layer, Option, Queue, Ref, Stream } from 'effect'
import { type BrowserWindow, Screen } from 'electrobun'
import { DesktopConfig } from '../../../platform/config/desktop.config'
import {
	electrobunEvents,
	listen,
} from '../../../platform/electrobun/electrobun-events.helper'
import { FrameStore } from '../application/frame-store.port'
import { MainWindow } from '../application/main-window.port'
import { applyFrameEvent, restoreFrame } from '../domain/window-frame.helper'
import type { WindowFrame } from '../domain/window-frame.schemas'
import { FRAME_SAVE_DELAY, WINDOW_TITLE } from '../domain/window.constants'
import { openAppWindow } from './app-window.helper'

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

	// Each event updates the frame inside its callback, in arrival order; only the file write waits.
	const frameChanges = Stream.callback<WindowFrame>(queue => {
		const track = (event: unknown) => {
			Queue.offerUnsafe(
				queue,
				Effect.runSync(
					Ref.updateAndGet(latest, frame => applyFrameEvent(frame, event))
				)
			)
		}

		return Effect.all([
			listen(`resize-${window.id}`, track),
			listen(`move-${window.id}`, track),
		])
	})

	yield* frameChanges.pipe(
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
		const window = yield* Effect.sync(() =>
			openAppWindow(appUrl, {
				title: WINDOW_TITLE,
				url: new URL('/app', appUrl).href,
				frame: restoreFrame(
					Option.getOrUndefined(saved),
					Screen.getAllDisplays().map(({ workArea }) => workArea)
				),
				titleBarStyle: 'hiddenInset',
			})
		)
		const { webview } = window

		yield* persistFrame(window)

		return MainWindow.of({
			load: url => Effect.sync(() => webview.loadURL(url.href)),
			reload: Effect.sync(() => webview.executeJavascript('location.reload()')),
			activate: Effect.sync(() => window.activate()),
			webviewEvents: name => electrobunEvents(`${name}-${webview.id}`),
		})
	})
)
