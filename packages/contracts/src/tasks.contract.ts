import { type ErrorMap, oc } from '@orpc/contract'
import {
	type CalendarDate,
	calendarDateSchema,
	labelIdSchema,
	projectIdSchema,
	SINGLE_INTERVAL_REPEAT_UNITS,
	GOAL_TARGET_MAX,
	GOAL_UNIT_MAX_LENGTH,
	TASK_DESCRIPTION_MAX_LENGTH,
	TASK_SEARCH_QUERY_MAX_LENGTH,
	TASK_TITLE_MAX_LENGTH,
	storedCalendarDateSchema,
	taskIdSchema,
} from '@soonlane/domain'
import { z } from 'zod'
import { authErrors } from './auth.errors'
import { projectNotFound } from './projects.contract'
import {
	dueTimeSchema,
	durationMinutesSchema,
	prioritySchema,
	repeatSchema,
	taskSchema,
} from './task.schemas'

/**
 * The open tasks of one view. `today` splits them; `from` and `to` (both or neither) limit the scheduled ones to a range, and without
 * them every task due from `today` on is scheduled. `labelId` and `projectId` keep the tasks with that label or in that project, and
 * each one that is not the owner's fails with NOT_FOUND. Every filter given applies.
 */
export const listTasksInputSchema = z
	.object({
		today: calendarDateSchema,
		from: calendarDateSchema.optional(),
		to: calendarDateSchema.optional(),
		labelId: labelIdSchema.optional(),
		projectId: projectIdSchema.optional(),
	})
	.refine(({ from, to }) => (from === undefined) === (to === undefined), {
		path: ['to'],
		message: 'A range needs both its start and its end.',
	})
	.refine(({ from, to }) => !from || !to || from <= to, {
		path: ['to'],
		message: 'The range must end on or after its start.',
	})
export type ListTasksInput = z.infer<typeof listTasksInputSchema>

/** `undated` holds the tasks without a due date: with a label or project filter all that match it, without one only those without a project (the Inbox). */
export const listTasksOutputSchema = z.object({
	undated: z.array(taskSchema),
	overdue: z.array(taskSchema),
	scheduled: z.array(taskSchema),
})
export type ListTasksOutput = z.infer<typeof listTasksOutputSchema>

export const listCompletedTasksInputSchema = z
	.object({ from: z.date(), to: z.date() })
	.refine(({ from, to }) => from < to, {
		path: ['to'],
		message: 'The range must end after its start.',
	})
export type ListCompletedTasksInput = z.infer<
	typeof listCompletedTasksInputSchema
>

/** `earlierCompletedAt` is the latest completion before `from`, absent when there is none. */
export const listCompletedTasksOutputSchema = z.object({
	tasks: z.array(taskSchema),
	earlierCompletedAt: z.date().optional(),
})
export type ListCompletedTasksOutput = z.infer<
	typeof listCompletedTasksOutputSchema
>

export const searchTasksInputSchema = z.object({
	query: z.string().trim().min(1).max(TASK_SEARCH_QUERY_MAX_LENGTH),
})
export type SearchTasksInput = z.infer<typeof searchTasksInputSchema>

export const searchTasksOutputSchema = z.object({
	tasks: z.array(taskSchema),
	hasMore: z.boolean(),
})
export type SearchTasksOutput = z.infer<typeof searchTasksOutputSchema>

/** `fromCompletion` ("every!") counts the next due date from the completion day; absent means false. */
export const repeatInputSchema = repeatSchema
	.extend({ fromCompletion: z.boolean().optional() })
	.refine(
		({ unit, interval }) =>
			interval === 1 || !SINGLE_INTERVAL_REPEAT_UNITS.includes(unit),
		{
			path: ['interval'],
			message: 'Every weekday and every year repeat with an interval of 1.',
		}
	)
export type RepeatInput = z.infer<typeof repeatInputSchema>

export const goalInputSchema = z.object({
	target: z.int().min(1).max(GOAL_TARGET_MAX),
	unit: z.string().trim().min(1).max(GOAL_UNIT_MAX_LENGTH).optional(),
})
export type GoalInput = z.infer<typeof goalInputSchema>

const taskInputSchema = z.object({
	title: z.string().trim().min(1).max(TASK_TITLE_MAX_LENGTH),
	description: z.string().trim().max(TASK_DESCRIPTION_MAX_LENGTH).optional(),
	dueDate: calendarDateSchema.optional(),
	dueTime: dueTimeSchema.optional(),
	durationMinutes: durationMinutesSchema.optional(),
	priority: prioritySchema.optional(),
	repeat: repeatInputSchema.optional(),
	labelIds: z
		.array(labelIdSchema)
		.refine(ids => new Set(ids).size === ids.length, {
			message: 'Each label can be added once.',
		})
		.optional(),
	goal: goalInputSchema.optional(),
	projectId: projectIdSchema.optional(),
})

/** The fields of a create, update or edit input that schedule a task; an update or edit may send null to clear them. */
interface TaskScheduleInput {
	dueDate?: CalendarDate | null
	dueTime?: string | null
	repeat?: RepeatInput | null
}

/** A task without a due date has no due time and no repeat rule. */
function isDatedWhenTimedOrRepeating({
	dueDate,
	dueTime,
	repeat,
}: TaskScheduleInput) {
	return Boolean(dueDate) || (!dueTime && !repeat)
}

const undatedTaskRule = {
	path: ['dueDate'],
	message: 'A due time or repeat rule needs a due date.',
}

const durationWithoutTime = { message: 'A duration needs a due time.' }

/**
 * An absent due date creates a task without one. `parentId` creates a subtask in its parent's project: a parent that is not the owner's
 * fails with NOT_FOUND, one that is completed, at the deepest level or full with CONFLICT.
 */
export const createTaskInputSchema = taskInputSchema
	.extend({ parentId: taskIdSchema.optional() })
	.refine(isDatedWhenTimedOrRepeating, undatedTaskRule)
	.refine(
		({ dueTime, durationMinutes }) =>
			durationMinutes === undefined || dueTime !== undefined,
		{ ...durationWithoutTime, path: ['durationMinutes'] }
	)
	.refine(({ parentId, projectId }) => !parentId || !projectId, {
		path: ['projectId'],
		message: 'Subtasks always use the same project as the task they belong to.',
	})
export type CreateTaskInput = z.infer<typeof createTaskInputSchema>

/**
 * For desktop apps that bundle a UI from before `tasks.edit`; the API maps it onto an edit until it can ask outdated apps to update.
 * Replaces every field (an absent description, due date or time clears it) but five that an absent value keeps for clients from before they could be edited
 * and for edits that do not show them: the repeat rule (cleared anyway without a due date), the duration (cleared anyway without a due time), the goal and
 * the project (null clears them) and the labels (`labelIds`, `[]` included, replaces them, leaving out ids that are not the owner's labels).
 * A `projectId` that is not the owner's project fails with NOT_FOUND; a duration the edit leaves without a due time, or another project
 * for a subtask, fails with BAD_REQUEST.
 * A goal at or below the progress of an open task completes it like a log reaching the target; `today` places a repeating task's next occurrence.
 */
export const updateTaskInputSchema = taskInputSchema
	.extend({
		id: taskIdSchema,
		priority: prioritySchema,
		durationMinutes: durationMinutesSchema.nullable().optional(),
		repeat: repeatInputSchema.nullable().optional(),
		goal: goalInputSchema.nullable().optional(),
		projectId: projectIdSchema.nullable().optional(),
		today: calendarDateSchema.optional(),
	})
	.refine(isDatedWhenTimedOrRepeating, undatedTaskRule)
export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>

/**
 * Writes only the fields it carries: absent keeps the stored value, null clears the description, due date, due time, duration,
 * repeat rule, goal or project, no due date also clears the time, duration and rule, and no due time the duration.
 * `labelIds`, `today` and the duration's BAD_REQUEST work as in `tasks.update`.
 */
export const editTaskInputSchema = taskInputSchema
	.partial()
	.extend({
		id: taskIdSchema,
		description: taskInputSchema.shape.description.nullable(),
		dueDate: calendarDateSchema.nullable().optional(),
		dueTime: dueTimeSchema.nullable().optional(),
		durationMinutes: durationMinutesSchema.nullable().optional(),
		repeat: repeatInputSchema.nullable().optional(),
		goal: goalInputSchema.nullable().optional(),
		projectId: projectIdSchema.nullable().optional(),
		today: calendarDateSchema.optional(),
	})
	.refine(isDatedWhenTimedOrRepeating, undatedTaskRule)
export type EditTaskInput = z.infer<typeof editTaskInputSchema>

/** `completed` when the edit's goal completed the task: the due date it was completed on (none for a task without one) and the goal and progress Undo restores. */
export const updateTaskOutputSchema = z.object({
	task: taskSchema,
	completed: z
		.object({
			dueDate: storedCalendarDateSchema.optional(),
			progress: z.int(),
			goal: z.object({ target: z.int(), unit: z.string().optional() }),
		})
		.optional(),
})
export type UpdateTaskOutput = z.infer<typeof updateTaskOutputSchema>

export const taskIdInputSchema = z.object({ id: taskIdSchema })

/** Both optional for clients from before repeating tasks. `dueDate` is the one the client saw. */
export const completeTaskInputSchema = taskIdInputSchema.extend({
	today: calendarDateSchema.optional(),
	dueDate: calendarDateSchema.optional(),
})

/** `changed` is false when the task was already completed or had already moved on, so the call left nothing to undo. */
export const completeTaskOutputSchema = z.object({
	task: taskSchema,
	changed: z.boolean(),
})
export type CompleteTaskOutput = z.infer<typeof completeTaskOutputSchema>

/** Undo of a repeating task sends the due date and the goal progress it had before completing; Undo of an edit that completed it also sends the goal. */
export const uncompleteTaskInputSchema = taskIdInputSchema.extend({
	dueDate: calendarDateSchema.optional(),
	progress: z.int().min(0).max(GOAL_TARGET_MAX).optional(),
	goal: goalInputSchema.optional(),
})

const RESCHEDULE_MAX_TASKS = 1000

export const rescheduleTasksInputSchema = z.object({
	ids: z.array(taskIdSchema).min(1).max(RESCHEDULE_MAX_TASKS),
	dueDate: calendarDateSchema,
})
export type RescheduleTasksInput = z.infer<typeof rescheduleTasksInputSchema>

export const taskLabelInputSchema = z.object({
	id: taskIdSchema,
	labelId: labelIdSchema,
})
export type TaskLabelInput = z.infer<typeof taskLabelInputSchema>

export const logProgressInputSchema = completeTaskInputSchema.extend({
	amount: z
		.int()
		.min(-GOAL_TARGET_MAX)
		.max(GOAL_TARGET_MAX)
		.refine(amount => amount !== 0, 'Log a non-zero amount.'),
})
export type LogProgressInput = z.infer<typeof logProgressInputSchema>

/** `logged` is the amount applied after clamping to the goal's range, so Undo reverts exactly that. */
export const logProgressOutputSchema = z.object({
	task: taskSchema,
	logged: z.int(),
	completed: z
		.object({ dueDate: storedCalendarDateSchema.optional(), progress: z.int() })
		.optional(),
})
export type LogProgressOutput = z.infer<typeof logProgressOutputSchema>

/** The server sends the label's or the project's own message. */
const listFilterNotFound = {
	message: 'This label or project no longer exists.',
}

const subtaskRefused = { message: "Couldn't add a subtask to this task." }

const taskErrors = {
	...authErrors,
	NOT_FOUND: { message: 'This task no longer exists.' },
} as const satisfies ErrorMap

export const tasksContract = {
	list: oc
		.errors({ ...authErrors, NOT_FOUND: listFilterNotFound })
		.input(listTasksInputSchema)
		.output(listTasksOutputSchema),
	create: oc
		.errors({
			...authErrors,
			NOT_FOUND: projectNotFound,
			CONFLICT: subtaskRefused,
		})
		.input(createTaskInputSchema)
		.output(z.object({ task: taskSchema })),
	update: oc
		.errors({ ...taskErrors, BAD_REQUEST: durationWithoutTime })
		.input(updateTaskInputSchema)
		.output(updateTaskOutputSchema),
	edit: oc
		.errors({ ...taskErrors, BAD_REQUEST: durationWithoutTime })
		.input(editTaskInputSchema)
		.output(updateTaskOutputSchema),
	delete: oc.errors(taskErrors).input(taskIdInputSchema).output(z.void()),
	complete: oc
		.errors(taskErrors)
		.input(completeTaskInputSchema)
		.output(completeTaskOutputSchema),
	uncomplete: oc
		.errors(taskErrors)
		.input(uncompleteTaskInputSchema)
		.output(z.object({ task: taskSchema })),
	reschedule: oc
		.errors(authErrors)
		.input(rescheduleTasksInputSchema)
		.output(z.object({ tasks: z.array(taskSchema) })),
	assignLabel: oc
		.errors(taskErrors)
		.input(taskLabelInputSchema)
		.output(z.object({ task: taskSchema })),
	unassignLabel: oc
		.errors(taskErrors)
		.input(taskLabelInputSchema)
		.output(z.object({ task: taskSchema })),
	logProgress: oc
		.errors(taskErrors)
		.input(logProgressInputSchema)
		.output(logProgressOutputSchema),
	listCompleted: oc
		.errors(authErrors)
		.input(listCompletedTasksInputSchema)
		.output(listCompletedTasksOutputSchema),
	search: oc
		.errors(authErrors)
		.input(searchTasksInputSchema)
		.output(searchTasksOutputSchema),
	get: oc
		.errors(taskErrors)
		.input(taskIdInputSchema)
		.output(z.object({ task: taskSchema })),
	/** The direct subtasks, open and completed, in day order; none for a task that is not the owner's. */
	listSubtasks: oc
		.errors(authErrors)
		.input(taskIdInputSchema)
		.output(z.object({ tasks: z.array(taskSchema) })),
}
