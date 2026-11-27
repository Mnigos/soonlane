import { LINEAR_PROVIDER_ID } from '@soonlane/auth'
import { account } from '@soonlane/db'
import type { UserId } from '@soonlane/domain'
import { and, desc, eq } from 'drizzle-orm'
import { Context, Effect, Layer } from 'effect'
import type { DbError } from '@/platform/db/db.errors'
import { Db } from '@/platform/db/db.layer'

/** A linked Linear account, the row Better Auth wrote and refreshes; the tokens are encrypted by Better Auth. */
export interface LinearAccount {
	id: string
	ownerId: UserId
	accessToken: string | null
	refreshToken: string | null
	accessTokenExpiresAt: Date | null
}

const columns = {
	id: account.id,
	ownerId: account.userId,
	accessToken: account.accessToken,
	refreshToken: account.refreshToken,
	accessTokenExpiresAt: account.accessTokenExpiresAt,
}
const isLinear = eq(account.providerId, LINEAR_PROVIDER_ID)

export class LinearAccountRepository extends Context.Service<
	LinearAccountRepository,
	{
		/** The owner's Linear accounts, the latest link first. */
		readonly list: (ownerId: UserId) => Effect.Effect<LinearAccount[], DbError>
		readonly delete: (
			linked: Pick<LinearAccount, 'id' | 'ownerId'>
		) => Effect.Effect<{ id: string } | undefined, DbError>
	}
>()('soonlane/LinearAccountRepository') {}

export const LinearAccountRepositoryLive = Layer.effect(
	LinearAccountRepository,
	Effect.gen(function* () {
		const db = yield* Db

		return LinearAccountRepository.of({
			list: ownerId =>
				db.run(
					'LinearAccountRepository.list',
					async database =>
						await database
							.select(columns)
							.from(account)
							.where(and(isLinear, eq(account.userId, ownerId)))
							.orderBy(desc(account.createdAt))
				),
			delete: ({ id, ownerId }) =>
				db.run('LinearAccountRepository.delete', async database => {
					const [row] = await database
						.delete(account)
						.where(
							and(isLinear, eq(account.id, id), eq(account.userId, ownerId))
						)
						.returning({ id: account.id })

					return row
				}),
		})
	})
)
