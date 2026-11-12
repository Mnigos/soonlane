import type { CalendarSubscription } from '@soonlane/contracts'
import { calendarSubscription } from '@soonlane/db'
import type { UserId } from '@soonlane/domain'
import { eq, sql } from 'drizzle-orm'
import { Context, Effect, Layer } from 'effect'
import type { DbError } from '@/platform/db/db.errors'
import { Db } from '@/platform/db/db.layer'

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

export const CalendarSubscriptionRepositoryLive = Layer.effect(
	CalendarSubscriptionRepository,
	Effect.gen(function* () {
		const db = yield* Db

		return CalendarSubscriptionRepository.of({
			find: ownerId =>
				db.run('CalendarSubscriptionRepository.find', async database => {
					const [row] = await database
						.select({ createdAt: calendarSubscription.createdAt })
						.from(calendarSubscription)
						.where(eq(calendarSubscription.ownerId, ownerId))

					return row
				}),
			findByTokenHash: tokenHash =>
				db.run(
					'CalendarSubscriptionRepository.findByTokenHash',
					async database => {
						const [row] = await database
							.select({
								ownerId: calendarSubscription.ownerId,
								createdAt: calendarSubscription.createdAt,
							})
							.from(calendarSubscription)
							.where(eq(calendarSubscription.tokenHash, tokenHash))

						return row
					}
				),
			create: ({ ownerId, tokenHash }) =>
				db.run('CalendarSubscriptionRepository.create', async database => {
					const [row] = await database
						.insert(calendarSubscription)
						.values({ ownerId, tokenHash })
						.onConflictDoUpdate({
							target: calendarSubscription.ownerId,
							set: { tokenHash, createdAt: sql`now()` },
						})
						.returning({ createdAt: calendarSubscription.createdAt })

					if (!row)
						throw new Error('Calendar subscription upsert returned no row')

					return row
				}),
			delete: ownerId =>
				db.run('CalendarSubscriptionRepository.delete', async database => {
					const [row] = await database
						.delete(calendarSubscription)
						.where(eq(calendarSubscription.ownerId, ownerId))
						.returning({ createdAt: calendarSubscription.createdAt })

					return row
				}),
		})
	})
)
