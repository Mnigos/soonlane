import { Context, type Effect, type Stream } from 'effect'

export type WebviewEventName = 'will-navigate' | 'new-window-open'

export class MainWindow extends Context.Service<
	MainWindow,
	{
		readonly load: (url: URL) => Effect.Effect<void>
		readonly reload: Effect.Effect<void>
		readonly activate: Effect.Effect<void>
		readonly webviewEvents: (name: WebviewEventName) => Stream.Stream<unknown>
	}
>()('soonlane/MainWindow') {}
