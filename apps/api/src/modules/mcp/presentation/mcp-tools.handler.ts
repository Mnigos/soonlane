import { McpServer } from '@modelcontextprotocol/server'
import { MCP_SCOPES } from '@soonlane/auth'
import type { McpGrant } from '../application/mcp.service'
import { registerReadTools } from './mcp-read-tools.handler'
import { type CreateMcpServerOptions, READ_TOOL_NAMES } from './mcp-tool.helper'

const INSTRUCTIONS =
	"Soonlane is the user's task list. Tools that depend on the day take `today`, the user's local date (YYYY-MM-DD); ask the user or read it from their device, never assume the server's. Ids come from other tools' results."

/** The tools a grant's scopes register: the read tools with `tasks:read`, which `tasks:write` implies. */
export function listMcpTools({ scopes }: Pick<McpGrant, 'scopes'>) {
	return scopes.includes(MCP_SCOPES.read) ? READ_TOOL_NAMES : []
}

/**
 * The MCP server for one request, with the tools the request's scopes allow. A new one per request, so no state outlives it, and its tool
 * list never changes (`listChanged: false`), so clients have nothing to listen for. Without a task scope `tools/list` answers an empty list.
 */
export function createMcpServer(options: CreateMcpServerOptions) {
	const server = new McpServer(
		{ name: 'soonlane', title: 'Soonlane', version: options.version },
		{
			capabilities: { tools: { listChanged: false } },
			instructions: INSTRUCTIONS,
		}
	)

	if (listMcpTools(options.grant).length > 0) registerReadTools(server, options)
	else server.server.setRequestHandler('tools/list', () => ({ tools: [] }))

	return server
}
