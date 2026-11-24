import { McpServer } from '@modelcontextprotocol/server'
import { MCP_SCOPES } from '@soonlane/auth'
import {
	listCompletedTasksInputSchema,
	listCompletedTasksToolInputSchema,
	listTasksInputSchema,
	listTasksToolInputSchema,
	searchTasksInputSchema,
	searchTasksToolInputSchema,
	taskIdInputSchema,
	taskIdToolInputSchema,
} from '@soonlane/contracts'
import { Effect } from 'effect'
import { LabelsService } from '@/modules/labels/application/labels.service'
import { ProjectsService } from '@/modules/projects/application/projects.service'
import { TasksService } from '@/modules/tasks/application/tasks.service'
import type { AppServices } from '@/platform/app.runtime'
import type { McpGrant } from '../application/mcp.service'
import { McpToolInputInvalid } from '../domain/mcp-tool.errors'

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

/** The tools the read scope registers; a `tools/call` naming one of them is logged by name, any other name never is. */
export const READ_TOOL_NAMES = [
	'list_tasks',
	'search_tasks',
	'get_task',
	'list_subtasks',
	'list_completed_tasks',
	'list_projects',
	'list_labels',
] as const
export type McpToolName = (typeof READ_TOOL_NAMES)[number]

/** Items a list tool returns at most; the lists themselves are unbounded, and an agent narrows them when `hasMore` says some were left out. */
const TOOL_LIST_LIMIT = 100
const READ_ONLY = {
	readOnlyHint: true,
	idempotentHint: true,
	openWorldHint: false,
}
const INSTRUCTIONS =
	"Soonlane is the user's task list. Tools that depend on the day take `today`, the user's local date (YYYY-MM-DD); ask the user or read it from their device, never assume the server's. Ids come from other tools' results."

/** The arguments again through the procedure's own schema, which applies the refinements the JSON Schema an agent reads leaves out. */
function parseInput<T>(schema: ContractSchema<T>, value: unknown) {
	const parsed = schema.safeParse(value)

	return parsed.success
		? Effect.succeed(parsed.data)
		: Effect.fail(
				new McpToolInputInvalid({
					issue: parsed.error.issues[0]?.message ?? 'Invalid arguments.',
				})
			)
}

function capped<TItem>(items: TItem[]) {
	return {
		items: items.slice(0, TOOL_LIST_LIMIT),
		hasMore: items.length > TOOL_LIST_LIMIT,
	}
}

function registerReadTools(
	server: McpServer,
	{ grant, run }: CreateMcpServerOptions
) {
	const { ownerId } = grant

	server.registerTool(
		'list_tasks',
		{
			title: 'List open tasks',
			description:
				"The user's open tasks for one view, in day order, in three lists: `undated` (no due date; without a label or project filter only those in no project, the Inbox), `overdue` (due before `today`, whatever the range) and `scheduled` (due on or after `today`; with `from` and `to`, only those due within that range, so a range that starts before `today` still puts earlier tasks in `overdue`). Leaves out completed tasks (list_completed_tasks) and subtasks without a due date (list_subtasks). `labelId` and `projectId` keep only the tasks with that label and in that project; an id that is not the user's answers not found. Each list holds at most 100 tasks; `hasMore` is true when one was cut, so narrow the range or add a filter.",
			inputSchema: listTasksToolInputSchema,
			annotations: READ_ONLY,
		},
		async args =>
			await run(
				'list_tasks',
				Effect.gen(function* () {
					const input = yield* parseInput(listTasksInputSchema, args)
					const tasksService = yield* TasksService
					const { undated, overdue, scheduled } = yield* tasksService.list(
						ownerId,
						input
					)
					const lists = [undated, overdue, scheduled].map(capped)

					return {
						undated: lists[0]?.items,
						overdue: lists[1]?.items,
						scheduled: lists[2]?.items,
						hasMore: lists.some(list => list.hasMore),
					}
				})
			)
	)

	server.registerTool(
		'search_tasks',
		{
			title: 'Search tasks',
			description:
				"The user's tasks, open and completed, subtasks included, whose title or description contains every word of the query: open ones first in day order, then completed ones, latest completion first. At most 50; `hasMore` is true when more match, so add words.",
			inputSchema: searchTasksToolInputSchema,
			annotations: READ_ONLY,
		},
		async args =>
			await run(
				'search_tasks',
				Effect.gen(function* () {
					const input = yield* parseInput(searchTasksInputSchema, args)
					const tasksService = yield* TasksService

					return yield* tasksService.search(ownerId, input)
				})
			)
	)

	server.registerTool(
		'get_task',
		{
			title: 'Get a task',
			description:
				"One of the user's tasks, open or completed, with its labels, project, repeat, goal progress, parent and subtask counts. Answers not found for an id that is not one of the user's tasks.",
			inputSchema: taskIdToolInputSchema,
			annotations: READ_ONLY,
		},
		async args =>
			await run(
				'get_task',
				Effect.gen(function* () {
					const { id } = yield* parseInput(taskIdInputSchema, args)
					const tasksService = yield* TasksService

					return { task: yield* tasksService.get(ownerId, id) }
				})
			)
	)

	server.registerTool(
		'list_subtasks',
		{
			title: 'List subtasks',
			description:
				"A task's direct subtasks, open and completed, in day order; their own subtasks need another call with their id. At most 100; `hasMore` is true when some were cut. Answers not found for an id that is not one of the user's tasks.",
			inputSchema: taskIdToolInputSchema,
			annotations: READ_ONLY,
		},
		async args =>
			await run(
				'list_subtasks',
				Effect.gen(function* () {
					const { id } = yield* parseInput(taskIdInputSchema, args)
					const tasksService = yield* TasksService

					yield* tasksService.get(ownerId, id)

					const { items, hasMore } = capped(
						yield* tasksService.listSubtasks(ownerId, id)
					)

					return { tasks: items, hasMore }
				})
			)
	)

	server.registerTool(
		'list_completed_tasks',
		{
			title: 'List completed tasks',
			description:
				'Tasks the user completed from `from` (inclusive) to `to` (exclusive), subtasks included, latest completion first. `earlierCompletedAt` is the latest completion before `from`, absent when there is none, which says whether looking further back finds anything. At most 100 tasks; `hasMore` is true when some were cut, so shorten the range.',
			inputSchema: listCompletedTasksToolInputSchema,
			annotations: READ_ONLY,
		},
		async args =>
			await run(
				'list_completed_tasks',
				Effect.gen(function* () {
					const range = yield* parseInput(
						listCompletedTasksToolInputSchema,
						args
					)
					const input = yield* parseInput(listCompletedTasksInputSchema, {
						from: new Date(range.from),
						to: new Date(range.to),
					})
					const tasksService = yield* TasksService
					const { tasks, earlierCompletedAt } =
						yield* tasksService.listCompleted(ownerId, input)

					const { items, hasMore } = capped(tasks)

					return { tasks: items, hasMore, earlierCompletedAt }
				})
			)
	)

	server.registerTool(
		'list_projects',
		{
			title: 'List projects',
			description:
				"The user's projects in the app's order, with how many open tasks each holds. Tasks in no project are in the Inbox, which is not a project; list_tasks without a filter shows them. At most 100; `hasMore` is true when some were cut.",
			annotations: READ_ONLY,
		},
		async () =>
			await run(
				'list_projects',
				Effect.gen(function* () {
					const projectsService = yield* ProjectsService

					const { items, hasMore } = capped(
						yield* projectsService.list(ownerId)
					)

					return { projects: items, hasMore }
				})
			)
	)

	server.registerTool(
		'list_labels',
		{
			title: 'List labels',
			description:
				"The user's labels in the app's order, with their colors and how many open tasks carry each. At most 100; `hasMore` is true when some were cut.",
			annotations: READ_ONLY,
		},
		async () =>
			await run(
				'list_labels',
				Effect.gen(function* () {
					const labelsService = yield* LabelsService

					const { items, hasMore } = capped(yield* labelsService.list(ownerId))

					return { labels: items, hasMore }
				})
			)
	)
}

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
