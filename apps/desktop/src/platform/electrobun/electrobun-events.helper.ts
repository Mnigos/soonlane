import { Effect, Queue, Stream } from 'effect'
import Electrobun from 'electrobun'

// Electrobun emits every event on one emitter and names per-object events `<event>-<id>`, e.g. `resize-1` or `will-navigate-2`.

// Runs the handler inside Electrobun's callback, for events after which the app may quit at once.
export function listen(name: string, handler: (event: unknown) => void) {
	return Effect.acquireRelease(
		Effect.sync(() => {
			Electrobun.events.on(name, handler)
		}),
		() =>
			Effect.sync(() => {
				Electrobun.events.off(name, handler)
			})
	)
}

export function electrobunEvents(name: string): Stream.Stream<unknown> {
	return Stream.callback<unknown>(queue =>
		listen(name, event => {
			Queue.offerUnsafe(queue, event)
		})
	)
}

export function handleEvents<TServices>(
	events: Stream.Stream<unknown>,
	handle: (event: unknown) => Effect.Effect<void, never, TServices>
) {
	return events.pipe(
		Stream.runForEach(event =>
			handle(event).pipe(
				Effect.catchCause(cause =>
					Effect.logError('Desktop event handler failed', cause)
				)
			)
		),
		Effect.forkScoped
	)
}
