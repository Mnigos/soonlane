import { createFileRoute } from '@tanstack/react-router'
import { Context, Effect } from 'effect'
import { Analytics } from '@/modules/analytics/application/analytics.port'
import { runtime } from '@/platform/app.runtime'
import { AppConfig } from '@/platform/config/app.config'
import { createRpcContext } from '@/platform/rpc/rpc.context'
import { createRpcHandler } from '@/platform/rpc/rpc.handler'

const handleRpc = createRpcHandler(
	async request =>
		await createRpcContext(await runtime.context(), request.headers),
	async () => Context.get(await runtime.context(), AppConfig).trustedOrigins,
	async error =>
		await Effect.runPromise(
			Context.get(await runtime.context(), Analytics).captureException(error)
		)
)

export const Route = createFileRoute('/api/rpc/$')({
	server: {
		handlers: {
			ANY: async ({ request }) => await handleRpc(request),
		},
	},
})
