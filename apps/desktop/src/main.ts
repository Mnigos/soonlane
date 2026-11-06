import { Effect } from 'effect'
import { Utils } from 'electrobun'
import { runtime } from './platform/app.runtime'

// Building the layers opens the window and wires the menu and navigation; the runtime keeps them until the app quits.
Effect.runFork(
	runtime.contextEffect.pipe(
		Effect.catchCause(cause =>
			Effect.logFatal('Soonlane could not start', cause).pipe(
				Effect.andThen(Effect.sync(() => Utils.quit(1)))
			)
		)
	)
)
