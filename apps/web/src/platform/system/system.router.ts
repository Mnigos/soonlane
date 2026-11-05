import { sql } from 'drizzle-orm'
import { Effect } from 'effect'
import { AppConfig } from '../config/app.config'
import { Db } from '../db/db.layer'
import { os } from '../rpc/rpc.base'

const LOCAL_VERSION = 'dev'

export const systemRouter = {
	health: os.system.health.effect(function* () {
		const { version } = yield* AppConfig
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

		return { ok: db === 'ok', db, version: version ?? LOCAL_VERSION }
	}),
}
