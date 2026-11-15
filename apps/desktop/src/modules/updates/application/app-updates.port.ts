import { Context, type Effect, type Stream } from 'effect'

/** Signed releases of the app, which update it in place (SOON-18). */
export class AppUpdates extends Context.Service<
	AppUpdates,
	{
		/** Whether a downloaded update waits for a restart; a page reads it when it loads. */
		readonly isReady: Effect.Effect<boolean>
		/** Emits each time a downloaded update starts waiting for a restart. */
		readonly ready: Stream.Stream<undefined>
		/** Restarts the app into the downloaded update; false when the restart did not start. */
		readonly apply: Effect.Effect<boolean>
		/** Downloads a newer version and restarts into it; false when there is none or either step failed. */
		readonly install: Effect.Effect<boolean>
	}
>()('soonlane/AppUpdates') {}
