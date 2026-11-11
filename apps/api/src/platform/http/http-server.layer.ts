import { Effect, Layer } from 'effect'
import { AppConfig } from '../config/app.config'

/**
 * Serves the API on `0.0.0.0:$PORT`. `/health` answers Railway's deploy check with the
 * environment and commit and never touches the database, so a database outage cannot block a deploy.
 */
export const HttpServerLive = Layer.effectDiscard(
	Effect.gen(function* () {
		const { port, environment, commit } = yield* AppConfig

		const server = yield* Effect.acquireRelease(
			Effect.sync(() =>
				Bun.serve({
					hostname: '0.0.0.0',
					port,
					routes: {
						'/health': {
							GET: Response.json({ ok: true, environment, commit }),
						},
					},
					fetch: () => new Response(null, { status: 404 }),
				})
			),
			// Stops accepting connections and resolves once requests in flight finish, within Railway's drain time.
			startedServer => Effect.promise(async () => await startedServer.stop())
		)

		yield* Effect.logInfo('API listening', server.url.href)
	})
)
