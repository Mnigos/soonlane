import { type ErrorMap, oc } from '@orpc/contract'
import {
	TASK_DESCRIPTION_MAX_LENGTH,
	TASK_PRIORITIES,
	TASK_TITLE_MAX_LENGTH,
} from '@soonlane/domain'
import { z } from 'zod'
import { authErrors } from './auth.errors'

const calendarDateSchema = z.iso.date()
const dueTimeSchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/u)
const prioritySchema = z.union(
	TASK_PRIORITIES.map(priority => z.literal(priority))
)

export const taskSchema = z.object({
	id: z.uuid(),
	title: z.string(),
	description: z.string().optional(),
	dueDate: calendarDateSchema,
	dueTime: dueTimeSchema.optional(),
	priority: prioritySchema,
	createdAt: z.date(),
	completedAt: z.date().optional(),
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

export const listTasksOutputSchema = z.object({
	overdue: z.array(taskSchema),
	scheduled: z.array(taskSchema),
})

export type ListTasksOutput = z.infer<typeof listTasksOutputSchema>

export const createTaskInputSchema = z.object({
	title: z.string().trim().min(1).max(TASK_TITLE_MAX_LENGTH),
	description: z.string().trim().max(TASK_DESCRIPTION_MAX_LENGTH).optional(),
	dueDate: calendarDateSchema,
	dueTime: dueTimeSchema.optional(),
	priority: prioritySchema.optional(),
})

export type CreateTaskInput = z.infer<typeof createTaskInputSchema>

export const updateTaskInputSchema = createTaskInputSchema.extend({
	id: z.uuid(),
	priority: prioritySchema,
})

export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>

export const taskIdInputSchema = z.object({ id: z.uuid() })

const taskErrors = {
	...authErrors,
	NOT_FOUND: { message: 'This task no longer exists.' },
} as const satisfies ErrorMap

export const tasksContract = {
	list: oc
		.errors(authErrors)
		.input(listTasksInputSchema)
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
		.input(taskIdInputSchema)
		.output(z.object({ task: taskSchema })),
	uncomplete: oc
		.errors(taskErrors)
		.input(taskIdInputSchema)
		.output(z.object({ task: taskSchema })),
}
