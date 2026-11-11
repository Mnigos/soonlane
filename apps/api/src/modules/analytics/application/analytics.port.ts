import type { UserId } from '@soonlane/domain'
import { Context, type Effect } from 'effect'
import type { ServerEvents } from '../domain/analytics-event.types'

/** Product analytics from the server; capturing never fails, so callers need no error handling. */
export class Analytics extends Context.Service<
	Analytics,
	{
		readonly capture: <TEvent extends keyof ServerEvents>(
			userId: UserId,
			event: TEvent,
			properties: ServerEvents[TEvent]
		) => Effect.Effect<void>
		readonly captureException: (
			error: unknown,
			userId?: UserId
		) => Effect.Effect<void>
	}
>()('soonlane/Analytics') {}

/** Whether the request carries a granted analytics consent; identified server events are sent only then. */
export const AnalyticsConsent = Context.Reference<boolean>(
	'soonlane/AnalyticsConsent',
	{ defaultValue: () => false }
)
