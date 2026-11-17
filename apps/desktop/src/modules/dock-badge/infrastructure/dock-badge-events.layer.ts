import { Effect, Layer, Option, Stream } from 'effect'
import { IdentityService } from '../../identity/application/identity.service'
import { DockBadge } from '../application/dock-badge.port'

export const DockBadgeEventsLive = Layer.effectDiscard(
	Effect.gen(function* () {
		const dockBadge = yield* DockBadge

		// A signed-out page has no Today list to count, so the badge clears here.
		yield* (yield* IdentityService).events.pipe(
			Stream.filter(
				event => event.type === 'token-changed' && Option.isNone(event.token)
			),
			Stream.runForEach(() => dockBadge.show(0)),
			Effect.forkScoped
		)
	})
)
