import { TODOIST_PROVIDER_ID } from '@soonlane/auth'
import { account } from '@soonlane/db'
import type { UserId } from '@soonlane/domain'
import { and, desc, eq, lt } from 'drizzle-orm'
import { Context, Effect, Layer } from 'effect'
import type { DbError } from '@/platform/db/db.errors'
import { Db } from '@/platform/db/db.layer'

/** A linked Todoist account, the row Better Auth wrote; the tokens are encrypted by Better Auth. */
export interface TodoistAccount {
	id: string
	ownerId: UserId
	accessToken: string | null
	refreshToken: string | null
	linkedAt: Date
}

const columns = {
	id: account.id,
	ownerId: account.userId,
	accessToken: account.accessToken,
	refreshToken: account.refreshToken,
	linkedAt: account.createdAt,
}
const isTodoist = eq(account.providerId, TODOIST_PROVIDER_ID)

export class TodoistAccountRepository extends Context.Service<
	TodoistAccountRepository,
	{
		/** The owner's Todoist accounts, the latest link first. */
		readonly list: (ownerId: UserId) => Effect.Effect<TodoistAccount[], DbError>
		/** Every owner's Todoist accounts linked before the cutoff, for the sweep. */
		readonly listLinkedBefore: (
			cutoff: Date
		) => Effect.Effect<TodoistAccount[], DbError>
		readonly delete: (
			linked: Pick<TodoistAccount, 'id' | 'ownerId'>
		) => Effect.Effect<{ id: string } | undefined, DbError>
	}
>()('soonlane/TodoistAccountRepository') {}

export const TodoistAccountRepositoryLive = Layer.effect(
	TodoistAccountRepository,
	Effect.gen(function* () {
		const db = yield* Db

		return TodoistAccountRepository.of({
			list: ownerId =>
				db.run(
					'TodoistAccountRepository.list',
					async database =>
						await database
							.select(columns)
							.from(account)
							.where(and(isTodoist, eq(account.userId, ownerId)))
							.orderBy(desc(account.createdAt))
				),
			listLinkedBefore: cutoff =>
				db.run(
					'TodoistAccountRepository.listLinkedBefore',
					async database =>
						await database
							.select(columns)
							.from(account)
							.where(and(isTodoist, lt(account.createdAt, cutoff)))
				),
			delete: ({ id, ownerId }) =>
				db.run('TodoistAccountRepository.delete', async database => {
					const [row] = await database
						.delete(account)
						.where(
							and(isTodoist, eq(account.id, id), eq(account.userId, ownerId))
						)
						.returning({ id: account.id })

					return row
				}),
		})
	})
)
