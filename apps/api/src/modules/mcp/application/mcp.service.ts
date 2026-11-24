import { MCP_CONNECTION_IDLE_DAYS, type McpScope } from '@soonlane/auth'
import type { McpConnection } from '@soonlane/contracts'
import type { UserId } from '@soonlane/domain'
import { Cause, Clock, Context, Effect, Layer, Schedule } from 'effect'
import type { McpAccessToken } from '@/modules/identity/application/auth.port'
import type { DbError } from '@/platform/db/db.errors'
import {
	McpConnectionNotFound,
	McpClientNotConnected,
	McpRequestLimitReached,
} from '../domain/mcp-connection.errors'
import { effectiveMcpScopes } from '../domain/mcp-scope.helper'
import {
	McpConnectionRepository,
	type OwnedMcpConnection,
} from '../infrastructure/mcp-connection.repository'
import { RateLimitRepository } from '../infrastructure/rate-limit.repository'

/** What one MCP request may do: whose tasks, and which task scopes both the token and the connection grant. */
export interface McpGrant {
	ownerId: UserId
	scopes: McpScope[]
}

export class McpService extends Context.Service<
	McpService,
	{
		readonly list: (ownerId: UserId) => Effect.Effect<McpConnection[], DbError>
		/**
		 * Admits one MCP request: the token's connection must exist and predate the token (`McpClientNotConnected` otherwise), and the user's agents
		 * get `MCP_REQUESTS_PER_MINUTE` requests a minute together. Records the use at most once a minute.
		 */
		readonly admit: (
			token: McpAccessToken
		) => Effect.Effect<
			McpGrant,
			DbError | McpClientNotConnected | McpRequestLimitReached
		>
		/** Ends the connection at once; the agent needs the Allow page again to come back. */
		readonly disconnect: (
			connection: OwnedMcpConnection
		) => Effect.Effect<void, DbError | McpConnectionNotFound>
	}
>()('soonlane/McpService') {}

const MS_PER_MINUTE = 60 * 1000
const IDLE_LIFETIME_MS = MCP_CONNECTION_IDLE_DAYS * 24 * 60 * MS_PER_MINUTE
const SWEEP_INTERVAL = '1 hour'
const MCP_REQUESTS_PER_MINUTE = 120
/** How stale "last used" may get: a use within this of the recorded one writes nothing. */
const LAST_USED_PRECISION_MS = MS_PER_MINUTE

export const McpServiceLive = Layer.effect(
	McpService,
	Effect.gen(function* () {
		const repository = yield* McpConnectionRepository
		const rateLimits = yield* RateLimitRepository

		const list = Effect.fn('McpService.list')(function* (ownerId: UserId) {
			return yield* repository.list(ownerId)
		})

		const admit = Effect.fn('McpService.admit')(function* ({
			ownerId,
			clientId,
			scopes,
			issuedAt,
		}: McpAccessToken) {
			const connection = yield* repository.findIssuing({
				clientId,
				ownerId,
				issuedAt,
			})

			if (!connection) return yield* Effect.fail(new McpClientNotConnected())

			const now = yield* Clock.currentTimeMillis
			const requests = yield* rateLimits.count({
				key: `mcp:${ownerId}`,
				windowMs: MS_PER_MINUTE,
				now,
			})

			if (requests > MCP_REQUESTS_PER_MINUTE)
				return yield* Effect.fail(new McpRequestLimitReached())

			const staleBefore = now - LAST_USED_PRECISION_MS

			if (
				!connection.lastUsedAt ||
				connection.lastUsedAt.getTime() < staleBefore
			)
				yield* repository.recordUse({
					id: connection.id,
					now: new Date(now),
					staleBefore: new Date(staleBefore),
				})

			return {
				ownerId,
				scopes: effectiveMcpScopes(scopes, connection.scopes),
			}
		})

		const disconnect = Effect.fn('McpService.disconnect')(function* (
			connection: OwnedMcpConnection
		) {
			const deleted = yield* repository.delete(connection)

			if (!deleted) yield* Effect.fail(new McpConnectionNotFound())
		})

		/**
		 * Removes connections unused for the refresh token's lifetime: their agents could no longer refresh, and a kept row would let a new sign-in skip
		 * the Allow page. Then removes the tokens no connection stands for, and expired client assertions, one per `private_key_jwt` refresh, which the
		 * provider leaves behind.
		 */
		const sweep = Effect.fn('McpService.sweep')(function* () {
			const now = yield* Clock.currentTimeMillis
			const unused = yield* repository.listUnusedBefore(
				new Date(now - IDLE_LIFETIME_MS)
			)

			yield* Effect.forEach(unused, repository.delete, { discard: true })
			yield* repository.deleteOrphanedTokens()
			yield* repository.deleteExpiredClientAssertions(new Date(now))
		})

		yield* sweep().pipe(
			Effect.catchCause(cause => {
				const error = Cause.squash(cause)

				// Only the name: driver errors embed SQL parameters.
				return Effect.logError(
					'MCP connection sweep failed',
					error instanceof Error ? error.name : typeof error
				)
			}),
			Effect.repeat(Schedule.spaced(SWEEP_INTERVAL)),
			Effect.forkScoped
		)

		return McpService.of({ list, admit, disconnect })
	})
)
