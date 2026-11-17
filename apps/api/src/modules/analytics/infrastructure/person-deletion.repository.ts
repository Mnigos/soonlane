import { personDeletion, user } from '@soonlane/db'
import type { UserId } from '@soonlane/domain'
import { and, eq, exists, inArray, lte, notExists } from 'drizzle-orm'
import { Context, Effect, Layer } from 'effect'
import type { DbError } from '@/platform/db/db.errors'
import { Db, type Database } from '@/platform/db/db.layer'

const CLAIM_LIMIT = 50

function userRow(database: Database) {
	return database
		.select({ id: user.id })
		.from(user)
		.where(eq(user.id, personDeletion.userId))
}

/** System-wide, like the Todoist sweep: a deleted account has no owner to filter by. */
export class PersonDeletionRepository extends Context.Service<
	PersonDeletionRepository,
	{
		/** Scheduling the user again moves the due time, so a retried account deletion waits the full delay. */
		readonly create: (
			userId: UserId,
			dueAt: Date
		) => Effect.Effect<{ userId: UserId } | undefined, DbError>
		/** Takes due deletions whose user row is gone and moves their due time to `retryAt`, so one cut short by a restart or a failure runs again then; a second instance skips the rows this one holds. */
		readonly claimDue: (
			now: Date,
			retryAt: Date
		) => Effect.Effect<UserId[], DbError>
		/** Removes due deletions whose user row still exists: the account deletion that scheduled them failed. */
		readonly deleteForRemainingUsers: (
			now: Date
		) => Effect.Effect<{ userId: UserId }[], DbError>
		/** Once PostHog has accepted the deletion. */
		readonly delete: (
			userId: UserId
		) => Effect.Effect<{ userId: UserId } | undefined, DbError>
	}
>()('soonlane/PersonDeletionRepository') {}

export const PersonDeletionRepositoryLive = Layer.effect(
	PersonDeletionRepository,
	Effect.gen(function* () {
		const db = yield* Db

		return PersonDeletionRepository.of({
			create: (userId, dueAt) =>
				db.run('PersonDeletionRepository.create', async database => {
					const [row] = await database
						.insert(personDeletion)
						.values({ userId, dueAt })
						.onConflictDoUpdate({
							target: personDeletion.userId,
							set: { dueAt },
						})
						.returning({ userId: personDeletion.userId })

					return row
				}),
			claimDue: (now, retryAt) =>
				db.run('PersonDeletionRepository.claimDue', async database => {
					const due = database
						.select({ userId: personDeletion.userId })
						.from(personDeletion)
						.where(
							and(lte(personDeletion.dueAt, now), notExists(userRow(database)))
						)
						.orderBy(personDeletion.dueAt)
						.limit(CLAIM_LIMIT)
						.for('update', { skipLocked: true })
					const claimed = await database
						.update(personDeletion)
						.set({ dueAt: retryAt })
						.where(inArray(personDeletion.userId, due))
						.returning({ userId: personDeletion.userId })

					return claimed.map(({ userId }) => userId)
				}),
			deleteForRemainingUsers: now =>
				db.run(
					'PersonDeletionRepository.deleteForRemainingUsers',
					async database =>
						await database
							.delete(personDeletion)
							.where(
								and(lte(personDeletion.dueAt, now), exists(userRow(database)))
							)
							.returning({ userId: personDeletion.userId })
				),
			delete: userId =>
				db.run('PersonDeletionRepository.delete', async database => {
					const [row] = await database
						.delete(personDeletion)
						.where(eq(personDeletion.userId, userId))
						.returning({ userId: personDeletion.userId })

					return row
				}),
		})
	})
)
