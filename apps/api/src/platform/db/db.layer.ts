import { drizzle } from 'drizzle-orm/node-postgres'
import { Context, Effect, Layer, Redacted } from 'effect'
import { Pool } from 'pg'
import { AppConfig } from '../config/app.config'
import {
	CONNECTION_TIMEOUT_MS,
	POOL_MAX_CONNECTIONS,
	QUERY_TIMEOUT_MS,
} from './db.constants'
import { DbError } from './db.errors'

export type Database = ReturnType<typeof createDatabase>

function createDatabase(pool: Pool) {
	return drizzle({ client: pool })
}

export class Db extends Context.Service<
	Db,
	{
		readonly database: Database
		readonly run: <TResult>(
			operation: string,
			execute: (database: Database) => Promise<TResult>
		) => Effect.Effect<TResult, DbError>
	}
>()('soonlane/Db') {}

export const DbLive = Layer.effect(
	Db,
	Effect.gen(function* () {
		const { databaseUrl } = yield* AppConfig

		const pool = yield* Effect.acquireRelease(
			Effect.sync(() => {
				const createdPool = new Pool({
					connectionString: Redacted.value(databaseUrl),
					max: POOL_MAX_CONNECTIONS,
					connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
					query_timeout: QUERY_TIMEOUT_MS,
				})

				// An idle client losing its connection emits 'error'; without a listener Node crashes the process.
				createdPool.on('error', error =>
					Effect.runSync(Effect.logError('Postgres pool error', error.message))
				)

				return createdPool
			}),
			createdPool => Effect.promise(async () => await createdPool.end())
		)
		const database = createDatabase(pool)

		return Db.of({
			database,
			run: (operation, execute) =>
				Effect.tryPromise({
					try: async () => await execute(database),
					catch: cause => new DbError({ operation, cause }),
				}),
		})
	})
)
