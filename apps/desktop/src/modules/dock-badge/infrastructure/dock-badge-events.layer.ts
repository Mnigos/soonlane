import { Effect, Layer } from 'effect'
import {
	electrobunEvents,
	handleEvents,
} from '../../../platform/electrobun/electrobun-events.helper'
import { DockBadge } from '../application/dock-badge.port'
import { readBadgeCount } from '../domain/dock-badge-event.helper'

export const DockBadgeEventsLive = Layer.effectDiscard(
	Effect.gen(function* () {
		const dockBadge = yield* DockBadge

		// Every window's page reports the count whenever today's tasks change, so the last report wins.
		yield* handleEvents(electrobunEvents('host-message'), event => {
			const count = readBadgeCount(event)

			return count === undefined ? Effect.void : dockBadge.show(count)
		})
	})
)
