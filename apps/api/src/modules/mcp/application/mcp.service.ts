import { MCP_CONNECTION_IDLE_DAYS } from '@soonlane/auth'
import type { McpConnection } from '@soonlane/contracts'
import type { UserId } from '@soonlane/domain'
import { Cause, Clock, Context, Effect, Layer, Schedule } from 'effect'
import type { DbError } from '@/platform/db/db.errors'
import { McpConnectionNotFound } from '../domain/mcp-connection.errors'
import {
	McpConnectionRepository,
	type OwnedMcpConnection,
} from '../infrastructure/mcp-connection.repository'

export class McpService extends Context.Service<
	McpService,
	{
		readonly list: (ownerId: UserId) => Effect.Effect<McpConnection[], DbError>
		/** Ends the connection at once; the agent needs the Allow page again to come back. */
		readonly disconnect: (
			connection: OwnedMcpConnection
		) => Effect.Effect<void, DbError | McpConnectionNotFound>
	}
>()('soonlane/McpService') {}

const IDLE_LIFETIME_MS = MCP_CONNECTION_IDLE_DAYS * 24 * 60 * 60 * 1000
const SWEEP_INTERVAL = '1 hour'

export const McpServiceLive = Layer.effect(
	McpService,
	Effect.gen(function* () {
		const repository = yield* McpConnectionRepository

		const list = Effect.fn('McpService.list')(function* (ownerId: UserId) {
			return yield* repository.list(ownerId)
		})

		const disconnect = Effect.fn('McpService.disconnect')(function* (
			connection: OwnedMcpConnection
		) {
			const deleted = yield* repository.delete(connection)

			if (!deleted) yield* Effect.fail(new McpConnectionNotFound())
		})

		/**
		 * Removes connections unused for the refresh token's lifetime: their agents could no longer refresh, and a kept row would let a new sign-in skip
		 * the Allow page. Also removes expired client assertions, one per `private_key_jwt` refresh, which the provider leaves behind.
		 */
		const sweep = Effect.fn('McpService.sweep')(function* () {
			const now = yield* Clock.currentTimeMillis
			const unused = yield* repository.listUnusedBefore(
				new Date(now - IDLE_LIFETIME_MS)
			)

			yield* Effect.forEach(unused, repository.delete, { discard: true })
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

		return McpService.of({ list, disconnect })
	})
)
