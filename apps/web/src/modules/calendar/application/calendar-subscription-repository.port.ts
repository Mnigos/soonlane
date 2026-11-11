import type { CalendarSubscription } from '@soonlane/contracts'
import type { UserId } from '@soonlane/domain'
import { Context, type Effect } from 'effect'
import type { DbError } from '@/platform/db/db.errors'

export interface OwnedCalendarSubscription extends CalendarSubscription {
	ownerId: UserId
}

export interface NewCalendarSubscription {
	ownerId: UserId
	tokenHash: string
}

export class CalendarSubscriptionRepository extends Context.Service<
	CalendarSubscriptionRepository,
	{
		readonly find: (
			ownerId: UserId
		) => Effect.Effect<CalendarSubscription | undefined, DbError>
		readonly findByTokenHash: (
			tokenHash: string
		) => Effect.Effect<OwnedCalendarSubscription | undefined, DbError>
		/** Replaces the owner's subscription, so the previous link stops working in the same statement. */
		readonly create: (
			subscription: NewCalendarSubscription
		) => Effect.Effect<CalendarSubscription, DbError>
		readonly delete: (
			ownerId: UserId
		) => Effect.Effect<CalendarSubscription | undefined, DbError>
	}
>()('soonlane/CalendarSubscriptionRepository') {}
