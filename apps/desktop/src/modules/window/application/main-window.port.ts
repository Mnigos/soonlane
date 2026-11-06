import { Context, type Effect, type Stream } from 'effect'

export type WebviewEventName = 'will-navigate' | 'new-window-open'

export class MainWindow extends Context.Service<
	MainWindow,
	{
		readonly load: (url: URL) => Effect.Effect<void>
		readonly reload: Effect.Effect<void>
		/** Brings the window to the front, e.g. when a `soonlane://` link opens the app. */
		readonly activate: Effect.Effect<void>
		/** The webview's events of this kind; Electrobun types their payloads as unknown. */
		readonly webviewEvents: (name: WebviewEventName) => Stream.Stream<unknown>
	}
>()('soonlane/MainWindow') {}
