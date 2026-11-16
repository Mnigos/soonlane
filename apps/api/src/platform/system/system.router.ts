import { sql } from 'drizzle-orm'
import { Effect } from 'effect'
import { AppConfig } from '../config/app.config'
import { Db } from '../db/db.layer'
import { os } from '../rpc/rpc.base'

/** Unset, every version is served; with `Bun.semver`, a prerelease of the minimum counts as older. */
function appSupport(version: string, minimumVersion: string | undefined) {
	return {
		isSupported:
			minimumVersion === undefined ||
			Bun.semver.order(version, minimumVersion) >= 0,
		minimumVersion: minimumVersion ?? '0.0.0',
	}
}

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
	desktopSupport: os.system.desktopSupport.effect(function* ({ input }) {
		const { desktopMinimumVersion } = yield* AppConfig

		return appSupport(input.version, desktopMinimumVersion)
	}),
	mobileSupport: os.system.mobileSupport.effect(function* ({ input }) {
		const { mobileMinimumVersion } = yield* AppConfig

		return appSupport(input.version, mobileMinimumVersion)
	}),
}
