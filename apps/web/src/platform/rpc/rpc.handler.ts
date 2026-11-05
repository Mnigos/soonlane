import { RPCHandler } from '@orpc/server/fetch'
import { Effect } from 'effect'
import { RPC_PREFIX } from '@/lib/orpc/rpc-prefix.constants'
import type { RpcContext } from './rpc.context'
import { router } from './rpc.router'

type ContextBuilder = (request: Request) => Promise<RpcContext>

type TrustedOriginsProvider = () => Promise<readonly string[]>

// Behind a TLS-terminating proxy request.url can be http://, so the configured app origins are trusted too.
async function isTrustedOrigin(
	origin: string,
	request: Request,
	getTrustedOrigins?: TrustedOriginsProvider
) {
	if (origin === new URL(request.url).origin) return true
	if (!getTrustedOrigins) return false

	const trustedOrigins = await getTrustedOrigins()

	return trustedOrigins.some(trusted => new URL(trusted).origin === origin)
}

export function createRpcHandler(
	buildContext: ContextBuilder,
	getTrustedOrigins?: TrustedOriginsProvider
) {
	const handler = new RPCHandler(router)

	return async function handleRpc(request: Request): Promise<Response> {
		const origin = request.headers.get('origin')

		try {
			if (
				origin &&
				!(await isTrustedOrigin(origin, request, getTrustedOrigins))
			)
				return new Response('Forbidden', { status: 403 })

			const { response } = await handler.handle(request, {
				prefix: RPC_PREFIX,
				context: await buildContext(request),
			})

			return response ?? new Response('Not Found', { status: 404 })
		} catch (error) {
			// Only the error name: driver errors can carry SQL parameters such as session tokens.
			Effect.runSync(
				Effect.logError(
					'RPC request failed',
					error instanceof Error ? error.name : typeof error
				)
			)

			return Response.json(
				{ message: 'The service is temporarily unavailable.' },
				{ status: 503 }
			)
		}
	}
}
