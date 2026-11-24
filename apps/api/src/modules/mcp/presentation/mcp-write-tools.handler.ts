import type {
	CallToolRequest,
	CallToolResult,
	McpServer,
	ServerContext,
} from '@modelcontextprotocol/server'
import {
	completeTaskInputSchema,
	completeTaskToolInputSchema,
	createTaskInputSchema,
	createTaskToolInputSchema,
	editTaskInputSchema,
	logProgressInputSchema,
	logProgressToolInputSchema,
	rescheduleTasksInputSchema,
	rescheduleTasksToolInputSchema,
	taskLabelInputSchema,
	taskLabelToolInputSchema,
	uncompleteTaskInputSchema,
	uncompleteTaskToolInputSchema,
	updateTaskToolInputSchema,
} from '@soonlane/contracts'
import { Effect } from 'effect'
import { TasksService } from '@/modules/tasks/application/tasks.service'
import {
	McpToolInputInvalid,
	McpToolNeedsWriteScope,
} from '../domain/mcp-tool.errors'
import {
	type CreateMcpServerOptions,
	type McpToolRunner,
	parseInput,
	WRITE_TOOL_NAMES,
} from './mcp-tool.helper'

/**
 * The SDK's stored `tools/call` handler, which `Protocol._getRequestHandler` gives and the SDK's types mark protected. Read only by
 * `refuseWriteTools`; checked at runtime, so an SDK that drops it leaves the SDK's own unknown tool error.
 */
interface StoredToolCallHandler {
	_getRequestHandler?: (
		method: 'tools/call'
	) =>
		| ((
				request: CallToolRequest,
				ctx: ServerContext
		  ) => Promise<CallToolResult>)
		| undefined
}

/** Nothing here deletes or reaches outside Soonlane; `idempotentHint` and `destructiveHint` are set per tool. */
const WRITES = { readOnlyHint: false, openWorldHint: false }
/**
 * Why `update_task` refuses a goal without `today`, which `tasks.edit` accepts from older clients: a goal that completes a repeating task
 * would move it one step from its old due date, which can still be in the past. The apps always send `today` with an edit.
 */
const GOAL_WITHOUT_TODAY =
	"Send `today`, the user's local date, with `goal`: a new goal can complete a repeating task and place its next occurrence."
const NOT_FOUND =
	"Answers not found for an id that is not one of the user's tasks."

/** The write tools `tasks:write` registers. Each does what its oRPC procedure does: the same input schema, service method and output. */
export function registerWriteTools(
	server: McpServer,
	{ grant, run }: CreateMcpServerOptions
) {
	const { ownerId } = grant

	server.registerTool(
		'create_task',
		{
			title: 'Add a task',
			description:
				"Adds a task to the user's list and returns it. Without `projectId` or `parentId` it goes to the Inbox; with `parentId` it becomes a subtask in its parent's project. A `projectId` or `parentId` that is not the user's answers not found; a completed parent, one 4 levels down or one with 50 subtasks refuses the subtask. Does not create projects or labels; list_projects and list_labels give their ids.",
			inputSchema: createTaskToolInputSchema,
			annotations: { ...WRITES, destructiveHint: false, idempotentHint: false },
		},
		async args =>
			await run(
				'create_task',
				Effect.gen(function* () {
					const input = yield* parseInput(createTaskInputSchema, args)
					const tasksService = yield* TasksService

					return { task: yield* tasksService.create(ownerId, input) }
				})
			)
	)

	server.registerTool(
		'update_task',
		{
			title: 'Edit a task',
			description: `Changes the fields given on one of the user's tasks and keeps every field left out, so send only what should change, with two exceptions: a new \`dueTime\` or \`repeat\` needs \`dueDate\` too (the task's current one to keep it), and a new \`goal\` needs \`today\`. null clears a field; \`labelIds\` replaces the whole label set. Returns the task, and \`completed\` when a new goal at or below the progress completed it (a repeating task moves to its next occurrence instead). Does not complete, reopen or delete a task: use complete_task and uncomplete_task. ${NOT_FOUND}`,
			inputSchema: updateTaskToolInputSchema,
			annotations: { ...WRITES, destructiveHint: true, idempotentHint: false },
		},
		async args =>
			await run(
				'update_task',
				Effect.gen(function* () {
					const input = yield* parseInput(editTaskInputSchema, args)

					if (input.goal && !input.today)
						return yield* new McpToolInputInvalid({ issue: GOAL_WITHOUT_TODAY })

					const tasksService = yield* TasksService

					return yield* tasksService.edit(ownerId, input.id, input)
				})
			)
	)

	server.registerTool(
		'complete_task',
		{
			title: 'Complete a task',
			description: `Completes one of the user's tasks with its open subtasks and returns it; its parent stays open. A goal task completes whatever its progress (log_progress adds to the progress instead). A repeating task is never closed: it moves to its next occurrence (the first after its due date that is not before \`today\`, or one step after \`today\` for a rule that repeats from completion) with its goal progress at 0, and its subtasks reopen and move along. \`changed\` is false when the task was already completed or had already moved on from \`dueDate\`, so a retry with the same \`dueDate\` is safe. ${NOT_FOUND}`,
			inputSchema: completeTaskToolInputSchema,
			annotations: { ...WRITES, destructiveHint: false, idempotentHint: false },
		},
		async args =>
			await run(
				'complete_task',
				Effect.gen(function* () {
					const input = yield* parseInput(completeTaskInputSchema, args)
					const tasksService = yield* TasksService

					return yield* tasksService.complete(ownerId, input.id, input)
				})
			)
	)

	server.registerTool(
		'uncomplete_task',
		{
			title: 'Reopen a task',
			description: `Reopens one of the user's completed tasks with the subtasks completed with it, and its completed parents, and returns it. A repeating task was moved on rather than completed: to undo that, pass the \`dueDate\` it had before. ${NOT_FOUND}`,
			inputSchema: uncompleteTaskToolInputSchema,
			annotations: { ...WRITES, destructiveHint: false, idempotentHint: true },
		},
		async args =>
			await run(
				'uncomplete_task',
				Effect.gen(function* () {
					const { id, dueDate, progress, goal } = yield* parseInput(
						uncompleteTaskInputSchema,
						args
					)
					const tasksService = yield* TasksService

					return {
						task: yield* tasksService.uncomplete(ownerId, id, {
							dueDate,
							progress,
							goal,
						}),
					}
				})
			)
	)

	server.registerTool(
		'reschedule_tasks',
		{
			title: 'Reschedule tasks',
			description:
				"Moves the user's open tasks among `ids` to `dueDate`, keeping their due time, repeat rule and subtasks as they are, and returns the tasks it moved. Ids of completed tasks, or that are not the user's tasks, are skipped rather than refused, so compare the result with `ids`.",
			inputSchema: rescheduleTasksToolInputSchema,
			annotations: { ...WRITES, destructiveHint: true, idempotentHint: true },
		},
		async args =>
			await run(
				'reschedule_tasks',
				Effect.gen(function* () {
					const input = yield* parseInput(rescheduleTasksInputSchema, args)
					const tasksService = yield* TasksService

					return { tasks: yield* tasksService.reschedule(ownerId, input) }
				})
			)
	)

	server.registerTool(
		'assign_label',
		{
			title: 'Add a label to a task',
			description:
				"Adds one of the user's labels to one of their tasks and returns the task; a label it already has stays once. A label or task id that is not the user's answers not found. Does not create labels.",
			inputSchema: taskLabelToolInputSchema,
			annotations: { ...WRITES, destructiveHint: false, idempotentHint: true },
		},
		async args =>
			await run(
				'assign_label',
				Effect.gen(function* () {
					const { id, labelId } = yield* parseInput(taskLabelInputSchema, args)
					const tasksService = yield* TasksService

					return {
						task: yield* tasksService.assignLabel(ownerId, id, labelId),
					}
				})
			)
	)

	server.registerTool(
		'unassign_label',
		{
			title: 'Take a label off a task',
			description:
				"Takes one of the user's labels off one of their tasks and returns the task; a label it does not have changes nothing. The label itself stays. A label or task id that is not the user's answers not found.",
			inputSchema: taskLabelToolInputSchema,
			annotations: { ...WRITES, destructiveHint: false, idempotentHint: true },
		},
		async args =>
			await run(
				'unassign_label',
				Effect.gen(function* () {
					const { id, labelId } = yield* parseInput(taskLabelInputSchema, args)
					const tasksService = yield* TasksService

					return {
						task: yield* tasksService.unassignLabel(ownerId, id, labelId),
					}
				})
			)
	)

	server.registerTool(
		'log_progress',
		{
			title: 'Log progress on a goal',
			description:
				"Adds `amount` to the goal progress of one of the user's tasks, kept between 0 and the goal's target, and returns the task with `logged`, the amount applied. Reaching the target completes the task and `completed` says so; a repeating task instead moves to its next occurrence (the first after its due date that is not before `today`, or one step after `today` for a rule that repeats from completion) with progress 0. Taking progress back below the target reopens a task it completed. Every call adds, even with the same `dueDate`, and a repeated call after the task moved on adds to its next occurrence without completing or moving it: when unsure whether a call went through, read the task with get_task before calling again. A task without a goal, or an id that is not one of the user's tasks, answers not found.",
			inputSchema: logProgressToolInputSchema,
			annotations: { ...WRITES, destructiveHint: false, idempotentHint: false },
		},
		async args =>
			await run(
				'log_progress',
				Effect.gen(function* () {
					const input = yield* parseInput(logProgressInputSchema, args)
					const tasksService = yield* TasksService

					return yield* tasksService.logProgress(
						ownerId,
						input.id,
						input.amount,
						input
					)
				})
			)
	)
}

/**
 * On a read-only grant, answers a `tools/call` naming a write tool with the reconnect message as a tool error, and passes every other call to
 * the SDK's handler, so `tools/list` still lists only the read tools and any other unknown name stays the SDK's error. The SDK has no public
 * way to reach its own handler, and registering the write tools would list them.
 */
export function refuseWriteTools(server: McpServer, run: McpToolRunner) {
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the protected accessor, see StoredToolCallHandler
	const stored = server.server as unknown as StoredToolCallHandler
	const sdkCallTool =
		typeof stored._getRequestHandler === 'function'
			? stored._getRequestHandler.call(server.server, 'tools/call')
			: undefined

	if (!sdkCallTool) return

	server.server.setRequestHandler('tools/call', async (request, ctx) => {
		const tool = WRITE_TOOL_NAMES.find(name => name === request.params.name)

		return tool
			? await run(tool, Effect.fail(new McpToolNeedsWriteScope()))
			: await sdkCallTool(request, ctx)
	})
}
