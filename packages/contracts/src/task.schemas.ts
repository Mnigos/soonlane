import {
	DURATION_MINUTES_MAX,
	DURATION_MINUTES_MIN,
	REPEAT_INTERVAL_MAX,
	REPEAT_UNITS,
	SUBTASK_DEPTH_MAX,
	TASK_PRIORITIES,
	storedCalendarDateSchema,
	taskIdSchema,
} from '@soonlane/domain'
import { z } from 'zod'
import { labelSchema } from './labels.contract'
import { projectSchema } from './projects.contract'

export const dueTimeSchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/u)
export const durationMinutesSchema = z
	.int()
	.min(DURATION_MINUTES_MIN)
	.max(DURATION_MINUTES_MAX)
export const prioritySchema = z.union(
	TASK_PRIORITIES.map(priority => z.literal(priority))
)
export const repeatSchema = z.object({
	unit: z.enum(REPEAT_UNITS),
	interval: z.int().min(1).max(REPEAT_INTERVAL_MAX),
})

/** `parent` is set on every subtask; `subtasks` counts the direct ones, open and completed, and is absent when there are none. */
export const taskSchema = z.object({
	id: taskIdSchema,
	title: z.string(),
	description: z.string().optional(),
	dueDate: storedCalendarDateSchema.optional(),
	dueTime: dueTimeSchema.optional(),
	durationMinutes: durationMinutesSchema.optional(),
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
	parent: z.object({ id: taskIdSchema, title: z.string() }).optional(),
	depth: z.int().min(0).max(SUBTASK_DEPTH_MAX),
	subtasks: z.object({ done: z.int(), total: z.int() }).optional(),
})
export type Task = z.infer<typeof taskSchema>
