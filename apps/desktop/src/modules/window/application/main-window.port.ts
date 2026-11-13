import { Context, type Effect, type Stream } from 'effect'

export type WebviewEventName = 'will-navigate' | 'new-window-open'

export class MainWindow extends Context.Service<
	MainWindow,
	{
		readonly reload: Effect.Effect<void>
		/** Brings the window forward, e.g. to sign in when Quick Add is pressed signed out. */
		readonly activate: Effect.Effect<void>
		/** The webview's events of this kind; Electrobun types their payloads as unknown. */
		readonly webviewEvents: (name: WebviewEventName) => Stream.Stream<unknown>
	}
>()('soonlane/MainWindow') {}
