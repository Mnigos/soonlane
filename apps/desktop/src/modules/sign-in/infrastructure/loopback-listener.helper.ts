import { LOOPBACK_HOST } from '@soonlane/auth'
import { Deferred, Effect } from 'effect'
import { readCallbackCode } from '../domain/sign-in.helper'
import { CALLBACK_PAGE } from './callback-page.constants'

/**
 * Listens on `127.0.0.1` with a port the OS picks (RFC 8252) until the scope
 * closes. The first `GET /callback?code=…` completes `code` and gets the
 * callback page; every other request, a second callback included, gets 404.
 */
export const listenForSignInCode = Effect.gen(function* () {
	const code = yield* Deferred.make<string>()
	const server = yield* Effect.acquireRelease(
		Effect.sync(() =>
			Bun.serve({
				hostname: LOOPBACK_HOST,
				port: 0,
				fetch: request => {
					const received = readCallbackCode(request)

					return received && Deferred.doneUnsafe(code, Effect.succeed(received))
						? new Response(CALLBACK_PAGE, {
								headers: {
									'content-type': 'text/html; charset=utf-8',
									'cache-control': 'no-store',
								},
							})
						: new Response(null, { status: 404 })
				},
			})
		),
		started => Effect.promise(async () => await started.stop(true))
	)

	// Bun reports no port only for a Unix socket, which this server never uses.
	if (server.port === undefined)
		return yield* Effect.die('The loopback listener has no port')

	return { port: server.port, code: Deferred.await(code) }
})
