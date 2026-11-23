import type { McpConnection } from '@soonlane/contracts'
import {
	oauthAccessToken,
	oauthClient,
	oauthClientAssertion,
	oauthConsent,
	oauthRefreshToken,
} from '@soonlane/db'
import type { McpConnectionId, UserId } from '@soonlane/domain'
import { and, desc, eq, isNotNull, lt, max, sql } from 'drizzle-orm'
import { Context, Effect, Layer } from 'effect'
import type { DbError } from '@/platform/db/db.errors'
import { Db } from '@/platform/db/db.layer'
import { toMcpConnection } from './mcp-connection.mapper'

export interface OwnedMcpConnection {
	id: McpConnectionId
	ownerId: UserId
}

/** The user's refresh tokens for the connection's client: each refresh adds a row, so the newest one is the last use. */
const connectionTokens = and(
	eq(oauthRefreshToken.clientId, oauthConsent.clientId),
	eq(oauthRefreshToken.userId, oauthConsent.userId)
)
const lastUsedAt = max(oauthRefreshToken.createdAt)
const MS_PER_SECOND = 1000

export class McpConnectionRepository extends Context.Service<
	McpConnectionRepository,
	{
		/** The owner's connections, the latest first. */
		readonly list: (ownerId: UserId) => Effect.Effect<McpConnection[], DbError>
		/** Every owner's connections not used since the cutoff, for the sweep: the latest of their newest refresh and when they were allowed or allowed again. */
		readonly listUnusedBefore: (
			cutoff: Date
		) => Effect.Effect<OwnedMcpConnection[], DbError>
		/** Deletes the provider's spent `private_key_jwt` assertions that expired before `now`, which the provider never deletes itself; their expiry already includes the clock tolerance. */
		readonly deleteExpiredClientAssertions: (
			now: Date
		) => Effect.Effect<void, DbError>
		/** Deletes the connection with the owner's tokens for its client in one transaction, so the agent can neither call nor refresh. */
		readonly delete: (
			connection: OwnedMcpConnection
		) => Effect.Effect<{ id: McpConnectionId } | undefined, DbError>
	}
>()('soonlane/McpConnectionRepository') {}

export const McpConnectionRepositoryLive = Layer.effect(
	McpConnectionRepository,
	Effect.gen(function* () {
		const db = yield* Db

		return McpConnectionRepository.of({
			list: ownerId =>
				db.run('McpConnectionRepository.list', async database => {
					const rows = await database
						.select({
							id: oauthConsent.id,
							clientId: oauthConsent.clientId,
							name: oauthClient.name,
							scopes: oauthConsent.scopes,
							connectedAt: oauthConsent.createdAt,
							lastUsedAt,
						})
						.from(oauthConsent)
						.innerJoin(
							oauthClient,
							eq(oauthClient.clientId, oauthConsent.clientId)
						)
						.leftJoin(oauthRefreshToken, connectionTokens)
						.where(eq(oauthConsent.userId, ownerId))
						.groupBy(oauthConsent.id, oauthClient.name)
						.orderBy(desc(oauthConsent.createdAt))

					return rows.map(toMcpConnection)
				}),
			listUnusedBefore: cutoff =>
				db.run('McpConnectionRepository.listUnusedBefore', async database => {
					const rows = await database
						.select({ id: oauthConsent.id, ownerId: oauthConsent.userId })
						.from(oauthConsent)
						.leftJoin(oauthRefreshToken, connectionTokens)
						.where(isNotNull(oauthConsent.userId))
						.groupBy(oauthConsent.id)
						.having(
							lt(
								sql`greatest(${lastUsedAt}, ${oauthConsent.updatedAt}, ${oauthConsent.createdAt})`,
								// Through the column's encoder, as UTC: pg would send a bare Date in the process's time zone, which a timestamp column ignores.
								sql.param(cutoff, oauthConsent.createdAt)
							)
						)

					return rows.flatMap(({ id, ownerId }) =>
						ownerId ? [{ id, ownerId }] : []
					)
				}),
			deleteExpiredClientAssertions: now =>
				db.run(
					'McpConnectionRepository.deleteExpiredClientAssertions',
					async database => {
						// The provider and jose compare `exp` in whole seconds, so a row stays needed until the second after its `expires_at`.
						const cutoff = new Date(
							Math.floor(now.getTime() / MS_PER_SECOND) * MS_PER_SECOND
						)

						await database
							.delete(oauthClientAssertion)
							.where(lt(oauthClientAssertion.expiresAt, cutoff))
					}
				),
			delete: ({ id, ownerId }) =>
				db.transaction('McpConnectionRepository.delete', async transaction => {
					const [row] = await transaction
						.delete(oauthConsent)
						.where(
							and(eq(oauthConsent.id, id), eq(oauthConsent.userId, ownerId))
						)
						.returning({
							id: oauthConsent.id,
							clientId: oauthConsent.clientId,
						})

					if (!row) return undefined

					await transaction
						.delete(oauthAccessToken)
						.where(
							and(
								eq(oauthAccessToken.clientId, row.clientId),
								eq(oauthAccessToken.userId, ownerId)
							)
						)
					await transaction
						.delete(oauthRefreshToken)
						.where(
							and(
								eq(oauthRefreshToken.clientId, row.clientId),
								eq(oauthRefreshToken.userId, ownerId)
							)
						)

					return { id: row.id }
				}),
		})
	})
)
