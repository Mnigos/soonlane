import { Effect } from 'effect'
import { runtime } from './platform/app.runtime'

Effect.runFork(
	runtime.contextEffect.pipe(
		Effect.catchCause(cause =>
			Effect.logFatal('Soonlane API could not start', cause).pipe(
				Effect.andThen(Effect.sync(() => process.exit(1)))
			)
		)
	)
)

// Railway sends SIGTERM, then waits the service's draining time before it kills the process.
process.once('SIGTERM', () => void runtime.dispose())
