import { Effect, Queue, Stream } from 'effect'
import Electrobun from 'electrobun'

// Electrobun emits every event on one emitter and names per-object events `<event>-<id>`, e.g. `resize-1` or `will-navigate-2`.

/** Calls the handler inside Electrobun's callback until the scope closes. For events after which the app may quit at once. */
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

/** The events with this name, in order; the listener is removed when the stream stops. */
export function electrobunEvents(name: string): Stream.Stream<unknown> {
	return Stream.callback<unknown>(queue =>
		listen(name, event => {
			Queue.offerUnsafe(queue, event)
		})
	)
}

/** Handles each event in the background of the enclosing scope; a failed handler is logged and the next event still runs. */
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
