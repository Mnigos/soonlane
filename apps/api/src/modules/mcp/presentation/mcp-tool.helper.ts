import { Effect } from 'effect'
import type { AppServices } from '@/platform/app.runtime'
import type { McpGrant } from '../application/mcp.service'
import { McpToolInputInvalid } from '../domain/mcp-tool.errors'

/** The tools `tasks:read` registers. A `tools/call` is logged by name only when it names a tool the request registered or a write tool on a read-only grant. */
export const READ_TOOL_NAMES = [
	'list_tasks',
	'search_tasks',
	'get_task',
	'list_subtasks',
	'list_completed_tasks',
	'list_projects',
	'list_labels',
] as const
/** The tools `tasks:write` adds; on a read-only grant a call naming one gets the reconnect answer instead of the SDK's unknown tool. */
export const WRITE_TOOL_NAMES = [
	'create_task',
	'update_task',
	'complete_task',
	'uncomplete_task',
	'reschedule_tasks',
	'assign_label',
	'unassign_label',
	'log_progress',
] as const
export type McpToolName =
	| (typeof READ_TOOL_NAMES)[number]
	| (typeof WRITE_TOOL_NAMES)[number]

/** Runs a tool's effect with the app's services and turns its value or failure into the tool's result. */
export type McpToolRunner = <TValue, TError>(
	tool: McpToolName,
	effect: Effect.Effect<TValue, TError, AppServices>
) => Promise<McpToolResult>

export interface McpToolResult {
	[key: string]: unknown
	content: { type: 'text'; text: string }[]
	isError?: boolean
}

export interface CreateMcpServerOptions {
	grant: McpGrant
	version: string
	run: McpToolRunner
}

/** What a contract schema's `safeParse` answers, enough to read a value or the first issue. */
interface ContractSchema<T> {
	safeParse: (
		value: unknown
	) =>
		| { success: true; data: T }
		| { success: false; error: { issues: { message: string }[] } }
}

/** The arguments again through the procedure's own schema, which applies the refinements the JSON Schema an agent reads leaves out. */
export function parseInput<T>(schema: ContractSchema<T>, value: unknown) {
	const parsed = schema.safeParse(value)

	return parsed.success
		? Effect.succeed(parsed.data)
		: Effect.fail(
				new McpToolInputInvalid({
					issue: parsed.error.issues[0]?.message ?? 'Invalid arguments.',
				})
			)
}
