import { RPCHandler } from '@orpc/server/fetch'
import { DESKTOP_PAGE_ORIGIN } from '@soonlane/auth'
import { RPC_PREFIX } from './rpc-prefix.constants'
import type { RpcContext } from './rpc.context'
import { router } from './rpc.router'

type ContextBuilder = (
	request: Request
) => Promise<{ context: RpcContext; setCookies: string[] }>

type ErrorReporter = (error: unknown) => Promise<void>

/**
 * A web origin from `TRUSTED_ORIGINS`, or the desktop app's bundled page without a cookie: it
 * authenticates with its bearer token only, so a session cookie never counts on its requests.
 */
function isAllowedOrigin(
	origin: string,
	headers: Headers,
	trustedOrigins: readonly string[]
) {
	return origin === DESKTOP_PAGE_ORIGIN
		? !headers.has('cookie')
		: trustedOrigins.includes(origin)
}

export function createRpcHandler(
	buildContext: ContextBuilder,
	trustedOrigins: readonly string[],
	reportError?: ErrorReporter
) {
	const handler = new RPCHandler(router)

	return async function handleRpc(request: Request): Promise<Response> {
		const origin = request.headers.get('origin')

		try {
			if (origin && !isAllowedOrigin(origin, request.headers, trustedOrigins))
				return new Response('Forbidden', { status: 403 })

			const { context, setCookies } = await buildContext(request)
			const { response = new Response('Not Found', { status: 404 }) } =
				await handler.handle(request, { prefix: RPC_PREFIX, context })

			for (const cookie of setCookies)
				response.headers.append('set-cookie', cookie)

			return response
		} catch (error) {
			try {
				await reportError?.(error)
			} catch {
				// Reporting must not replace the 503, e.g. when the runtime itself failed to build.
			}

			return Response.json(
				{ message: 'The service is temporarily unavailable.' },
				{ status: 503 }
			)
		}
	}
}
