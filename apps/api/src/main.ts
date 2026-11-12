import { Effect } from 'effect'
import { runtime } from './platform/app.runtime'

/**
 * `ManagedRuntime` listens for no signal itself. Disposing it releases the layers in reverse order: the server stops
 * accepting requests and drains those in flight, PostHog flushes its queue, then the database pool closes.
 * Railway sends SIGTERM and kills the process after the service's `drainingSeconds`; SIGINT covers a local stop.
 */
async function shutDown() {
	try {
		await runtime.dispose()
	} catch {
		process.exit(1)
	}

	process.exit(0)
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

process.once('SIGTERM', () => void shutDown())
process.once('SIGINT', () => void shutDown())
