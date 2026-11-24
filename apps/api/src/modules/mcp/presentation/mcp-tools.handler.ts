import { McpServer } from '@modelcontextprotocol/server'
import { MCP_SCOPES } from '@soonlane/auth'
import type { McpGrant } from '../application/mcp.service'
import { registerReadTools } from './mcp-read-tools.handler'
import {
	type CreateMcpServerOptions,
	type McpToolName,
	READ_TOOL_NAMES,
	WRITE_TOOL_NAMES,
} from './mcp-tool.helper'
import { refuseWriteTools, registerWriteTools } from './mcp-write-tools.handler'

const INSTRUCTIONS =
	"Soonlane is the user's task list. Tools that depend on the day take `today`, the user's local date (YYYY-MM-DD); ask the user or read it from their device, never assume the server's. Ids come from other tools' results. Tools that write change the user's real list and none deletes anything: read a task before you change it. Pass the `dueDate` a task showed to complete_task, which makes a retry safe; log_progress adds on every call, so read the task again before repeating one you are unsure about."

/** The tools a grant's scopes register: the read tools with `tasks:read`, and the write tools too with `tasks:write`, which implies it. */
export function listMcpTools({
	scopes,
}: Pick<McpGrant, 'scopes'>): readonly McpToolName[] {
	if (scopes.includes(MCP_SCOPES.write))
		return [...READ_TOOL_NAMES, ...WRITE_TOOL_NAMES]

	return scopes.includes(MCP_SCOPES.read) ? READ_TOOL_NAMES : []
}

/**
 * The MCP server for one request, with the tools the request's scopes allow. A new one per request, so no state outlives it, and its tool
 * list never changes (`listChanged: false`), so clients have nothing to listen for. Without a task scope `tools/list` answers an empty list;
 * with `tasks:read` alone a write tool called by name answers that the agent can only see tasks.
 */
export function createMcpServer(options: CreateMcpServerOptions) {
	const server = new McpServer(
		{ name: 'soonlane', title: 'Soonlane', version: options.version },
		{
			capabilities: { tools: { listChanged: false } },
			instructions: INSTRUCTIONS,
		}
	)

	const { scopes } = options.grant

	if (!scopes.includes(MCP_SCOPES.read)) {
		server.server.setRequestHandler('tools/list', () => ({ tools: [] }))

		return server
	}

	registerReadTools(server, options)

	if (scopes.includes(MCP_SCOPES.write)) registerWriteTools(server, options)
	else refuseWriteTools(server, options.run)

	return server
}
