import { MCP_PATH } from '@soonlane/auth'
import { requireUser } from '@/modules/identity/presentation/require-user.middleware'
import { AppConfig } from '@/platform/config/app.config'
import { os } from '@/platform/rpc/rpc.base'
import { McpService } from '../application/mcp.service'

export const mcpRouter = {
	listConnections: os.mcp.listConnections.use(requireUser).effect(function* ({
		context,
	}) {
		const mcpService = yield* McpService
		const { baseUrl } = yield* AppConfig

		return {
			connections: yield* mcpService.list(context.user.id),
			serverUrl: `${baseUrl}${MCP_PATH}`,
		}
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
