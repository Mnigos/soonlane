import { requireUser } from '@/modules/identity/presentation/require-user.middleware'
import { os } from '@/platform/rpc/rpc.base'
import { McpService } from '../application/mcp.service'

export const mcpRouter = {
	listConnections: os.mcp.listConnections.use(requireUser).effect(function* ({
		context,
	}) {
		const mcpService = yield* McpService

		return { connections: yield* mcpService.list(context.user.id) }
	}),
	disconnect: os.mcp.disconnect.use(requireUser).effect(function* ({
		context,
		input,
	}) {
		const mcpService = yield* McpService

		yield* mcpService.disconnect({
			id: input.id,
			ownerId: context.user.id,
		})
	}),
}
