import { sql } from 'drizzle-orm'
import { Effect } from 'effect'
import { AppConfig } from '../config/app.config'
import { Db } from '../db/db.layer'
import { os } from '../rpc/rpc.base'

export const systemRouter = {
	health: os.system.health.effect(function* () {
		const db = yield* (yield* Db)
			.run(
				'System.health',
				async database => await database.execute(sql`select 1`)
			)
			.pipe(
				Effect.as('ok' as const),
				Effect.catchTag('DbError', error =>
					Effect.logWarning('Health check failed', error.operation).pipe(
						Effect.as('down' as const)
					)
				)
			)

		const { version, commit } = yield* AppConfig

		return { ok: db === 'ok', db, version, commit }
	}),
}
