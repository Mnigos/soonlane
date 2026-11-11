import { calendarSubscription } from '@soonlane/db'
import { eq, sql } from 'drizzle-orm'
import { Effect, Layer } from 'effect'
import { Db } from '@/platform/db/db.layer'
import { CalendarSubscriptionRepository } from '../application/calendar-subscription-repository.port'

export const DrizzleCalendarSubscriptionRepositoryLive = Layer.effect(
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
