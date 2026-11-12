import { Effect } from 'effect'
import { runtime } from './platform/app.runtime'

/**
 * `ManagedRuntime` listens for no signal itself. Disposing it releases the layers in reverse order: the server stops
 * accepting requests and drains those in flight, PostHog flushes its queue, then the database pool closes.
 * Railway sends SIGTERM and kills the process after the service's `drainingSeconds`; SIGINT covers a local stop.
 */
function shutDown() {
	void runtime.dispose().then(
		() => process.exit(0),
		() => process.exit(1)
	)
}

Effect.runFork(
	runtime.contextEffect.pipe(
		Effect.catchCause(cause =>
			Effect.logFatal('Soonlane API could not start', cause).pipe(
				Effect.andThen(Effect.sync(() => process.exit(1)))
			)
		)
	)
)

process.once('SIGTERM', shutDown)
process.once('SIGINT', shutDown)
