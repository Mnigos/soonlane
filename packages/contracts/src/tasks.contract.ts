import { type ErrorMap, oc } from '@orpc/contract'
import {
	type CalendarDate,
	calendarDateSchema,
	labelIdSchema,
	projectIdSchema,
	REPEAT_INTERVAL_MAX,
	REPEAT_UNITS,
	SINGLE_INTERVAL_REPEAT_UNITS,
	GOAL_TARGET_MAX,
	GOAL_UNIT_MAX_LENGTH,
	TASK_DESCRIPTION_MAX_LENGTH,
	TASK_PRIORITIES,
	TASK_SEARCH_QUERY_MAX_LENGTH,
	TASK_TITLE_MAX_LENGTH,
	storedCalendarDateSchema,
	taskIdSchema,
} from '@soonlane/domain'
import { z } from 'zod'
import { authErrors } from './auth.errors'
import { labelSchema } from './labels.contract'
import { projectNotFound, projectSchema } from './projects.contract'
import { query } from './read-only.base'

const dueTimeSchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/u)
const prioritySchema = z.union(
	TASK_PRIORITIES.map(priority => z.literal(priority))
)
const repeatSchema = z.object({
	unit: z.enum(REPEAT_UNITS),
	interval: z.int().min(1).max(REPEAT_INTERVAL_MAX),
})

export const taskSchema = z.object({
	id: taskIdSchema,
	title: z.string(),
	description: z.string().optional(),
	dueDate: storedCalendarDateSchema.optional(),
	dueTime: dueTimeSchema.optional(),
	priority: prioritySchema,
	createdAt: z.date(),
	completedAt: z.date().optional(),
	repeat: repeatSchema
		.extend({ anchor: storedCalendarDateSchema, fromCompletion: z.boolean() })
		.optional(),
	labels: z.array(labelSchema),
	project: projectSchema.optional(),
	goal: z
		.object({
			target: z.int(),
			unit: z.string().optional(),
			progress: z.int(),
		})
		.optional(),
})
export type Task = z.infer<typeof taskSchema>

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

export const listCompletedTasksOutputSchema = z.object({
	tasks: z.array(taskSchema),
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

/** An absent due date creates a task without one. */
export const createTaskInputSchema = taskInputSchema.refine(
	isDatedWhenTimedOrRepeating,
	undatedTaskRule
)
export type CreateTaskInput = z.infer<typeof createTaskInputSchema>

/**
 * For desktop apps that bundle a UI from before `tasks.edit`; the API maps it onto an edit until it can ask outdated apps to update.
 * Replaces every field (an absent description, due date or time clears it) but four that an absent value keeps for clients from before they could be edited
 * and for edits that do not show them: the repeat rule (cleared anyway without a due date), the goal and the project (null clears them) and the labels
 * (`labelIds`, `[]` included, replaces them, leaving out ids that are not the owner's labels). A `projectId` that is not the owner's project fails with NOT_FOUND.
 * A goal at or below the progress of an open task completes it like a log reaching the target; `today` places a repeating task's next occurrence.
 */
export const updateTaskInputSchema = taskInputSchema
	.extend({
		id: taskIdSchema,
		priority: prioritySchema,
		repeat: repeatInputSchema.nullable().optional(),
		goal: goalInputSchema.nullable().optional(),
		projectId: projectIdSchema.nullable().optional(),
		today: calendarDateSchema.optional(),
	})
	.refine(isDatedWhenTimedOrRepeating, undatedTaskRule)
export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>

/**
 * Writes only the fields it carries: absent keeps the stored value, null clears the description, due date, due time, repeat rule,
 * goal or project, and no due date also clears the time and the rule. `labelIds` and `today` work as in `tasks.update`.
 */
export const editTaskInputSchema = taskInputSchema
	.partial()
	.extend({
		id: taskIdSchema,
		description: taskInputSchema.shape.description.nullable(),
		dueDate: calendarDateSchema.nullable().optional(),
		dueTime: dueTimeSchema.nullable().optional(),
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

const taskErrors = {
	...authErrors,
	NOT_FOUND: { message: 'This task no longer exists.' },
} as const satisfies ErrorMap

export const tasksContract = {
	list: query
		.errors({ ...authErrors, NOT_FOUND: listFilterNotFound })
		.input(listTasksInputSchema)
		.output(listTasksOutputSchema),
	create: oc
		.errors({ ...authErrors, NOT_FOUND: projectNotFound })
		.input(createTaskInputSchema)
		.output(z.object({ task: taskSchema })),
	update: oc
		.errors(taskErrors)
		.input(updateTaskInputSchema)
		.output(updateTaskOutputSchema),
	edit: oc
		.errors(taskErrors)
		.input(editTaskInputSchema)
		.output(updateTaskOutputSchema),
	delete: oc.errors(taskErrors).input(taskIdInputSchema).output(z.void()),
	complete: oc
		.errors(taskErrors)
		.input(completeTaskInputSchema)
		.output(z.object({ task: taskSchema })),
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
	listCompleted: query
		.errors(authErrors)
		.input(listCompletedTasksInputSchema)
		.output(listCompletedTasksOutputSchema),
	search: query
		.errors(authErrors)
		.input(searchTasksInputSchema)
		.output(searchTasksOutputSchema),
	get: query
		.errors(taskErrors)
		.input(taskIdInputSchema)
		.output(z.object({ task: taskSchema })),
}
