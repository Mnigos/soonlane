import type { UserId } from '@soonlane/domain'
import { Context, type Effect } from 'effect'
import type { ServerEvents } from '../domain/analytics-event.types'
import type { PersonDeletionFailed } from '../domain/person-deletion.errors'

/** Product analytics from the server; only `deletePerson` fails, so its caller can try again. */
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
			userId?: UserId,
			details?: Record<string, string>
		) => Effect.Effect<void>
		/** Asks PostHog to remove the user's person with their events and recordings; succeeds without asking when the API sends PostHog nothing (no `POSTHOG_KEY`). */
		readonly deletePerson: (
			userId: UserId
		) => Effect.Effect<void, PersonDeletionFailed>
	}
>()('soonlane/Analytics') {}

/** Whether the request carries a granted analytics consent; identified server events are sent only then. */
export const AnalyticsConsent = Context.Reference<boolean>(
	'soonlane/AnalyticsConsent',
	{ defaultValue: () => false }
)
