import { COMMON_ERROR_STATUS_MAP } from '@orpc/server'
import { RPCHandler } from '@orpc/server/fetch'
import { MAINTENANCE_ERROR } from '@soonlane/contracts'
import { RPC_PREFIX } from './rpc-prefix.constants'
import type { RpcContext } from './rpc.context'
import { router } from './rpc.router'

type ContextBuilder = (
	request: Request
) => Promise<{ context: RpcContext; setCookies: string[] }>

type ErrorReporter = (error: unknown) => Promise<void>

export function createRpcHandler(
	buildContext: ContextBuilder,
	trustedOrigins: readonly string[],
	reportError?: ErrorReporter
) {
	const handler = new RPCHandler(router, {
		errorStatusMap: {
			...COMMON_ERROR_STATUS_MAP,
			[MAINTENANCE_ERROR.code]: 503,
		},
	})

	return async function handleRpc(request: Request): Promise<Response> {
		const origin = request.headers.get('origin')

		try {
			if (origin && !trustedOrigins.includes(origin))
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
