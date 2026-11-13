import { Effect, Layer, Option, Stream } from 'effect'
import {
	electrobunEvents,
	handleEvents,
} from '../../../platform/electrobun/electrobun-events.helper'
import { DesktopSession } from '../../sign-in/application/desktop-session.service'
import { DockBadge } from '../application/dock-badge.port'
import { readBadgeCount } from '../domain/dock-badge-event.helper'

export const DockBadgeEventsLive = Layer.effectDiscard(
	Effect.gen(function* () {
		const dockBadge = yield* DockBadge

		yield* handleEvents(electrobunEvents('host-message'), event => {
			const count = readBadgeCount(event)

			return count === undefined ? Effect.void : dockBadge.show(count)
		})

		// A signed-out page has no Today list to count, so the badge clears here.
		yield* (yield* DesktopSession).events.pipe(
			Stream.filter(
				event => event.type === 'token-changed' && Option.isNone(event.token)
			),
			Stream.runForEach(() => dockBadge.show(0)),
			Effect.forkScoped
		)
	})
)
