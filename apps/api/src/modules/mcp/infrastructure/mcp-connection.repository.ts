import type { McpConnection } from '@soonlane/contracts'
import {
	oauthAccessToken,
	oauthClient,
	oauthClientAssertion,
	oauthConsent,
	oauthRefreshToken,
} from '@soonlane/db'
import type { McpConnectionId, UserId } from '@soonlane/domain'
import {
	and,
	desc,
	eq,
	exists,
	isNotNull,
	isNull,
	lt,
	lte,
	not,
	or,
	sql,
} from 'drizzle-orm'
import { Context, Effect, Layer } from 'effect'
import type { DbError } from '@/platform/db/db.errors'
import { Db } from '@/platform/db/db.layer'
import { toMcpConnection } from './mcp-connection.mapper'

export interface OwnedMcpConnection {
	id: McpConnectionId
	ownerId: UserId
}

/** A token's client and user, and when it was issued (`iat`, whole seconds). */
export interface IssuedMcpToken {
	clientId: string
	ownerId: UserId
	issuedAt: Date
}

/** The connection an agent's token was issued under: the scopes the user allowed and when the agent last called. */
export interface IssuingMcpConnection {
	id: McpConnectionId
	scopes: string[]
	lastUsedAt: Date | null
}

export interface McpConnectionUse {
	id: McpConnectionId
	/** When the request came. */
	now: Date
	/** Writes only when the last recorded use is older than this, so concurrent requests write once. */
	staleBefore: Date
}

/** When the connection was last used, allowed or allowed again; Postgres' `greatest` skips a null. */
const lastActiveAt = sql`greatest(${oauthConsent.lastUsedAt}, ${oauthConsent.updatedAt}, ${oauthConsent.createdAt})`
const MS_PER_SECOND = 1000

/**
 * Whether a token stands for its user's current connection to its client: one allowed no later than the token was written. The provider writes the
 * consent's `created_at` and a token's `created_at` from the same floor-second clock, and a new Allow after a Disconnect writes a new `created_at`.
 */
function hasIssuingConnection(
	token: typeof oauthRefreshToken | typeof oauthAccessToken
) {
	return exists(
		sql`(select 1 from ${oauthConsent} where ${and(
			eq(oauthConsent.clientId, token.clientId),
			eq(oauthConsent.userId, token.userId),
			lte(oauthConsent.createdAt, token.createdAt)
		)})`
	)
}

export class McpConnectionRepository extends Context.Service<
	McpConnectionRepository,
	{
		/** The owner's connections, the latest first. */
		readonly list: (ownerId: UserId) => Effect.Effect<McpConnection[], DbError>
		/**
		 * The connection a token was issued under: the user's connection to its client, allowed at or before the token's `iat`. Both are whole seconds,
		 * so a token issued in the second of a new Allow passes; one from before a Disconnect and a new Allow does not.
		 */
		readonly findIssuing: (
			token: IssuedMcpToken
		) => Effect.Effect<IssuingMcpConnection | undefined, DbError>
		/** Records a use of the connection unless one after `staleBefore` is already recorded. */
		readonly recordUse: (use: McpConnectionUse) => Effect.Effect<void, DbError>
		/** Every owner's connections not used since the cutoff, for the sweep: the latest of their last MCP request and when they were allowed or allowed again. */
		readonly listUnusedBefore: (
			cutoff: Date
		) => Effect.Effect<OwnedMcpConnection[], DbError>
		/** Deletes the provider's spent `private_key_jwt` assertions that expired before `now`, which the provider never deletes itself; their expiry already includes the clock tolerance. */
		readonly deleteExpiredClientAssertions: (
			now: Date
		) => Effect.Effect<void, DbError>
		/**
		 * Deletes the access and refresh tokens no connection stands for, for the sweep: those of a user and client without a connection, which a refresh
		 * racing a Disconnect or a code exchanged after one leaves, and those written before their connection was allowed, from an earlier connection.
		 */
		readonly deleteOrphanedTokens: () => Effect.Effect<void, DbError>
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
							lastUsedAt: oauthConsent.lastUsedAt,
						})
						.from(oauthConsent)
						.innerJoin(
							oauthClient,
							eq(oauthClient.clientId, oauthConsent.clientId)
						)
						.where(eq(oauthConsent.userId, ownerId))
						.orderBy(desc(oauthConsent.createdAt))

					return rows.map(toMcpConnection)
				}),
			findIssuing: ({ clientId, ownerId, issuedAt }) =>
				db.run('McpConnectionRepository.findIssuing', async database => {
					const [row] = await database
						.select({
							id: oauthConsent.id,
							scopes: oauthConsent.scopes,
							lastUsedAt: oauthConsent.lastUsedAt,
						})
						.from(oauthConsent)
						.where(
							and(
								eq(oauthConsent.clientId, clientId),
								eq(oauthConsent.userId, ownerId),
								lte(oauthConsent.createdAt, issuedAt)
							)
						)

					return row
				}),
			recordUse: ({ id, now, staleBefore }) =>
				db.run('McpConnectionRepository.recordUse', async database => {
					await database
						.update(oauthConsent)
						.set({ lastUsedAt: now })
						.where(
							and(
								eq(oauthConsent.id, id),
								or(
									isNull(oauthConsent.lastUsedAt),
									lt(oauthConsent.lastUsedAt, staleBefore)
								)
							)
						)
				}),
			listUnusedBefore: cutoff =>
				db.run('McpConnectionRepository.listUnusedBefore', async database => {
					const rows = await database
						.select({ id: oauthConsent.id, ownerId: oauthConsent.userId })
						.from(oauthConsent)
						.where(
							and(
								isNotNull(oauthConsent.userId),
								lt(
									lastActiveAt,
									// Through the column's encoder, as UTC: pg would send a bare Date in the process's time zone, which a timestamp column ignores.
									sql.param(cutoff, oauthConsent.createdAt)
								)
							)
						)

					return rows.flatMap(({ id, ownerId }) =>
						ownerId ? [{ id, ownerId }] : []
					)
				}),
			deleteOrphanedTokens: () =>
				db.transaction(
					'McpConnectionRepository.deleteOrphanedTokens',
					async transaction => {
						await transaction
							.delete(oauthAccessToken)
							.where(not(hasIssuingConnection(oauthAccessToken)))
						await transaction
							.delete(oauthRefreshToken)
							.where(not(hasIssuingConnection(oauthRefreshToken)))
					}
				),
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
