import { Effect } from 'effect'
import { Utils } from 'electrobun'
import { runtime } from './platform/app.runtime'

Effect.runFork(
	runtime.contextEffect.pipe(
		Effect.catchCause(cause =>
			Effect.logFatal('Soonlane could not start', cause).pipe(
				Effect.andThen(Effect.sync(() => Utils.quit(1)))
			)
		)
	)
)
