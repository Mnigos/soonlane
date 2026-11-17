import { drizzle } from 'drizzle-orm/node-postgres'
import { Context, Effect, Layer, Redacted } from 'effect'
import { Pool } from 'pg'
import { AppConfig } from '../config/app.config'
import {
	CONNECTION_TIMEOUT_MS,
	POOL_MAX_CONNECTIONS,
	QUERY_TIMEOUT_MS,
	TRANSACTION_RETRIES,
} from './db.constants'
import { DbError, findDriverErrorCode, isTransactionAbort } from './db.errors'

export type Database = ReturnType<typeof createDatabase>
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0]

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
		/**
		 * Runs `execute` in one transaction, and again from the start, up to `TRANSACTION_RETRIES` more times, when Postgres
		 * aborts it as a deadlock or serialization failure. Postgres undoes every aborted attempt, so the body may only write to
		 * the database.
		 */
		readonly transaction: <TResult>(
			operation: string,
			execute: (transaction: Transaction) => Promise<TResult>
		) => Effect.Effect<TResult, DbError>
	}
>()('soonlane/Db') {}

export const DbLive = Layer.effect(
	Db,
	Effect.gen(function* () {
		const { databaseUrl } = yield* AppConfig
		const context = yield* Effect.context()

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
					Effect.runSyncWith(context)(
						Effect.logError('Postgres pool error', error.message)
					)
				)

				return createdPool
			}),
			createdPool =>
				Effect.promise(async () => await createdPool.end()).pipe(
					Effect.andThen(Effect.logInfo('Postgres pool closed'))
				)
		)
		const database = createDatabase(pool)
		const run = <TResult>(
			operation: string,
			execute: (database: Database) => Promise<TResult>
		) =>
			Effect.tryPromise({
				try: async () => await execute(database),
				catch: cause => new DbError({ operation, cause }),
			})

		return Db.of({
			database,
			run,
			transaction: (operation, execute) =>
				run(operation, async () => await database.transaction(execute)).pipe(
					Effect.tapError(error =>
						isTransactionAbort(error)
							? Effect.logWarning(
									'Postgres aborted a transaction',
									operation,
									findDriverErrorCode(error.cause)
								)
							: Effect.void
					),
					Effect.retry({
						times: TRANSACTION_RETRIES,
						while: isTransactionAbort,
					})
				),
		})
	})
)
