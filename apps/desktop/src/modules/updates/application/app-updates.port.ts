import { Context, type Effect, type Stream } from 'effect'

/** Signed releases of the app, which update it in place (SOON-18). */
export class AppUpdates extends Context.Service<
	AppUpdates,
	{
		/** Emits when a downloaded update waits for a restart. */
		readonly ready: Stream.Stream<undefined>
		/** Restarts the app into the downloaded update. */
		readonly apply: Effect.Effect<void>
		/** Downloads a newer version and restarts into it; false when there is none or it failed. */
		readonly install: Effect.Effect<boolean>
	}
>()('soonlane/AppUpdates') {}
