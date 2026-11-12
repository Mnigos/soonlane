import { AUTH_BASE_PATH } from '@soonlane/auth/server'
import { Context, Effect, Layer, Redacted } from 'effect'
import { Analytics } from '@/modules/analytics/application/analytics.port'
import { createCalendarFeedHandler } from '@/modules/calendar/presentation/calendar-feed.handler'
import { Auth } from '@/modules/identity/application/auth.port'
import type { AppServices } from '../app.runtime'
import { AppConfig } from '../config/app.config'
import { RPC_PREFIX } from '../rpc/rpc-prefix.constants'
import { createRpcContext } from '../rpc/rpc.context'
import { createRpcHandler } from '../rpc/rpc.handler'
import { withClientIp } from './client-ip.helper'
import { withCors } from './cors.helper'

/**
 * How long a shutdown waits for requests in flight once the server stops accepting new ones; the rest are cut.
 * Kept under Railway's `drainingSeconds`, so PostHog's final flush and the pool's close still run before SIGKILL.
 */
const SERVER_DRAIN_TIMEOUT = '15 seconds'
/** Bun's default of 10 s also cuts a request still waiting on its handler; this outlasts `todoist.preview` (a 20 s read, then up to two 15 s revokes). */
const IDLE_TIMEOUT_SECONDS = 60

/**
 * Serves the API on `0.0.0.0:$PORT`. `/health` answers Railway's deploy check with the
 * environment and commit and never touches the database, so a database outage cannot block a deploy.
 * Auth and RPC answer CORS first (`withCors`), then resolve the client IP (`withClientIp`); the calendar feed needs neither.
 */
export const HttpServerLive = Layer.effectDiscard(
	Effect.gen(function* () {
		const { port, environment, commit, trustedOrigins, proxySecret } =
			yield* AppConfig
		const services = yield* Effect.context<AppServices>()
		const auth = Context.get(services, Auth)
		const forBrowser = (handle: (request: Request) => Promise<Response>) =>
			withCors(
				services,
				trustedOrigins,
				withClientIp(services, Redacted.value(proxySecret), handle)
			)
		const handleAuth = forBrowser(auth.handle)
		const handleRpc = forBrowser(
			createRpcHandler(
				async request => await createRpcContext(services, request.headers),
				trustedOrigins,
				async error =>
					await Effect.runPromiseWith(services)(
						// Only the error name: driver errors can carry SQL parameters such as session tokens.
						Effect.logError(
							'RPC request failed',
							error instanceof Error ? error.name : typeof error
						).pipe(
							Effect.andThen(
								Context.get(services, Analytics).captureException(error)
							)
						)
					)
			)
		)

		const server = yield* Effect.acquireRelease(
			Effect.sync(() =>
				Bun.serve({
					// Both stacks: Railway's private network resolves `api.railway.internal` to IPv6 too, and to IPv6 only in older environments.
					hostname: '::',
					port,
					idleTimeout: IDLE_TIMEOUT_SECONDS,
					development: false,
					routes: {
						'/health': {
							GET: Response.json({ ok: true, environment, commit }),
						},
						[`${AUTH_BASE_PATH}/*`]: {
							GET: handleAuth,
							POST: handleAuth,
							OPTIONS: handleAuth,
						},
						[`${RPC_PREFIX}/*`]: handleRpc,
						'/calendar/*': createCalendarFeedHandler(services),
					},
					fetch: () => new Response(null, { status: 404 }),
					// Only the name: Better Auth and driver errors embed SQL parameters such as session tokens.
					error: error => {
						Effect.runSyncWith(services)(
							Effect.logError('Request failed', error.name)
						)

						return new Response(null, { status: 500 })
					},
				})
			),
			startedServer =>
				Effect.promise(async () => await startedServer.stop()).pipe(
					Effect.timeoutOrElse({
						duration: SERVER_DRAIN_TIMEOUT,
						orElse: () =>
							Effect.logWarning(
								'Requests still in flight after the drain timeout, closing them'
							).pipe(
								Effect.andThen(
									Effect.promise(async () => await startedServer.stop(true))
								)
							),
					}),
					Effect.andThen(Effect.logInfo('API server stopped'))
				)
		)

		yield* Effect.logInfo('API listening', server.url.href)
	})
)
