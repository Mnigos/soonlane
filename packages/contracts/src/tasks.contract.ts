import { type ErrorMap, oc } from '@orpc/contract'
import {
	CALENDAR_DATE_MAX,
	CALENDAR_DATE_MIN,
	REPEAT_INTERVAL_MAX,
	REPEAT_UNITS,
	SINGLE_INTERVAL_REPEAT_UNITS,
	GOAL_TARGET_MAX,
	GOAL_UNIT_MAX_LENGTH,
	TASK_DESCRIPTION_MAX_LENGTH,
	TASK_PRIORITIES,
	TASK_TITLE_MAX_LENGTH,
} from '@soonlane/domain'
import { z } from 'zod'
import { authErrors } from './auth.errors'
import { labelNotFound, labelSchema } from './labels.contract'

const calendarDateSchema = z.iso
	.date()
	.refine(date => date >= CALENDAR_DATE_MIN && date <= CALENDAR_DATE_MAX, {
		message: `Dates must fall between ${CALENDAR_DATE_MIN} and ${CALENDAR_DATE_MAX}.`,
	})
const dueTimeSchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/u)
const prioritySchema = z.union(
	TASK_PRIORITIES.map(priority => z.literal(priority))
)
const repeatSchema = z.object({
	unit: z.enum(REPEAT_UNITS),
	interval: z.int().min(1).max(REPEAT_INTERVAL_MAX),
})

// Unbounded, so rows saved before the date bounds still list.
export const taskSchema = z.object({
	id: z.uuid(),
	title: z.string(),
	description: z.string().optional(),
	dueDate: z.iso.date(),
	dueTime: dueTimeSchema.optional(),
	priority: prioritySchema,
	createdAt: z.date(),
	completedAt: z.date().optional(),
	repeat: repeatSchema.extend({ anchor: z.iso.date() }).optional(),
	labels: z.array(labelSchema),
	goal: z
		.object({
			target: z.int(),
			unit: z.string().optional(),
			progress: z.int(),
		})
		.optional(),
})

export type Task = z.infer<typeof taskSchema>

export const listTasksInputSchema = z
	.object({
		from: calendarDateSchema,
		to: calendarDateSchema,
		today: calendarDateSchema,
	})
	.refine(({ from, to }) => from <= to, {
		path: ['to'],
		message: 'The range must end on or after its start.',
	})

export type ListTasksInput = z.infer<typeof listTasksInputSchema>

export const listTasksByLabelInputSchema = z.object({
	labelId: z.uuid(),
	today: calendarDateSchema,
})

export type ListTasksByLabelInput = z.infer<typeof listTasksByLabelInputSchema>

export const listTasksOutputSchema = z.object({
	overdue: z.array(taskSchema),
	scheduled: z.array(taskSchema),
})

export type ListTasksOutput = z.infer<typeof listTasksOutputSchema>

export const repeatInputSchema = repeatSchema.refine(
	({ unit, interval }) =>
		interval === 1 || !SINGLE_INTERVAL_REPEAT_UNITS.includes(unit),
	{
		path: ['interval'],
		message: 'Every weekday and every year repeat with an interval of 1.',
	}
)

export type RepeatInput = z.infer<typeof repeatInputSchema>

export const createTaskInputSchema = z.object({
	title: z.string().trim().min(1).max(TASK_TITLE_MAX_LENGTH),
	description: z.string().trim().max(TASK_DESCRIPTION_MAX_LENGTH).optional(),
	dueDate: calendarDateSchema,
	dueTime: dueTimeSchema.optional(),
	priority: prioritySchema.optional(),
	repeat: repeatInputSchema.optional(),
	labelIds: z
		.array(z.uuid())
		.refine(ids => new Set(ids).size === ids.length, {
			message: 'Each label can be added once.',
		})
		.optional(),
	goal: z
		.object({
			target: z.int().min(1).max(GOAL_TARGET_MAX),
			unit: z.string().trim().min(1).max(GOAL_UNIT_MAX_LENGTH).optional(),
		})
		.optional(),
})

export type CreateTaskInput = z.infer<typeof createTaskInputSchema>

// Replaces every field (an absent description or time clears it) but the repeat rule: null clears it, absent keeps it for clients from before repeating tasks.
// Editing a goal comes later (SOON-57), so an edit leaves the goal and its progress alone.
export const updateTaskInputSchema = createTaskInputSchema
	.omit({ goal: true })
	.extend({
		id: z.uuid(),
		priority: prioritySchema,
		repeat: repeatInputSchema.nullable().optional(),
	})

export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>

export const taskIdInputSchema = z.object({ id: z.uuid() })

// Both optional for clients from before repeating tasks. `dueDate` is the one the client saw.
export const completeTaskInputSchema = taskIdInputSchema.extend({
	today: calendarDateSchema.optional(),
	dueDate: calendarDateSchema.optional(),
})

// Undo of a repeating task sends the due date and the goal progress it had before completing.
export const uncompleteTaskInputSchema = taskIdInputSchema.extend({
	dueDate: calendarDateSchema.optional(),
	progress: z.int().min(0).max(GOAL_TARGET_MAX).optional(),
})

const RESCHEDULE_MAX_TASKS = 1000

export const rescheduleTasksInputSchema = z.object({
	ids: z.array(z.uuid()).min(1).max(RESCHEDULE_MAX_TASKS),
	dueDate: calendarDateSchema,
})

export type RescheduleTasksInput = z.infer<typeof rescheduleTasksInputSchema>

export const taskLabelInputSchema = z.object({
	id: z.uuid(),
	labelId: z.uuid(),
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

/** `logged` is the amount the server applied after clamping; `completed` is set when this log completed the task, with the due date and progress Undo restores. */
export const logProgressOutputSchema = z.object({
	task: taskSchema,
	logged: z.int(),
	completed: z.object({ dueDate: z.iso.date(), progress: z.int() }).optional(),
})

export type LogProgressOutput = z.infer<typeof logProgressOutputSchema>

const taskErrors = {
	...authErrors,
	NOT_FOUND: { message: 'This task no longer exists.' },
} as const satisfies ErrorMap

export const tasksContract = {
	list: oc
		.errors(authErrors)
		.input(listTasksInputSchema)
		.output(listTasksOutputSchema),
	listByLabel: oc
		.errors({ ...authErrors, NOT_FOUND: labelNotFound })
		.input(listTasksByLabelInputSchema)
		.output(listTasksOutputSchema),
	create: oc
		.errors(authErrors)
		.input(createTaskInputSchema)
		.output(z.object({ task: taskSchema })),
	update: oc
		.errors(taskErrors)
		.input(updateTaskInputSchema)
		.output(z.object({ task: taskSchema })),
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
}
