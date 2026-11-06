import { Context, type Effect, type Stream } from 'effect'

export type WebviewEventName = 'will-navigate' | 'new-window-open'

export class MainWindow extends Context.Service<
	MainWindow,
	{
		readonly load: (url: URL) => Effect.Effect<void>
		readonly reload: Effect.Effect<void>
		/** The webview's events of this kind; Electrobun types their payloads as unknown. */
		readonly webviewEvents: (name: WebviewEventName) => Stream.Stream<unknown>
	}
>()('soonlist/MainWindow') {}
