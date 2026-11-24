import { calendarDateSchema } from '@soonlane/domain'
import { z } from 'zod'
import {
	completeTaskInputSchema,
	createTaskInputSchema,
	editTaskInputSchema,
	goalInputSchema,
	listTasksInputSchema,
	logProgressInputSchema,
	repeatInputSchema,
	rescheduleTasksInputSchema,
	searchTasksInputSchema,
	taskIdInputSchema,
	taskLabelInputSchema,
	uncompleteTaskInputSchema,
} from './tasks.contract'

const taskIdField = taskIdInputSchema.shape.id.describe(
	"The task's id, as a task in another tool's result gives it."
)

/**
 * The MCP tools' inputs, as agents see them: the procedures' fields with descriptions. The JSON Schema an agent reads drops refinements, so
 * each tool parses its arguments again with the procedure's own input schema.
 */
export const listTasksToolInputSchema = z.object({
	today: listTasksInputSchema.shape.today.describe(
		"The user's local date, YYYY-MM-DD, from the user's device or time zone. Tasks due before it are overdue; the server never guesses it."
	),
	from: listTasksInputSchema.shape.from.describe(
		'First due date of the scheduled range, YYYY-MM-DD, inclusive. Give it with `to`, or neither for every task due from `today` on.'
	),
	to: listTasksInputSchema.shape.to.describe(
		'Last due date of the scheduled range, YYYY-MM-DD, inclusive, on or after `from`.'
	),
	labelId: listTasksInputSchema.shape.labelId.describe(
		'Keep only tasks with this label, from list_labels.'
	),
	projectId: listTasksInputSchema.shape.projectId.describe(
		'Keep only tasks in this project, from list_projects.'
	),
})

export const searchTasksToolInputSchema = z.object({
	query: searchTasksInputSchema.shape.query.describe(
		'Words that must all appear in the title or the description, in any case, matched as plain text.'
	),
})

export const taskIdToolInputSchema = z.object({ id: taskIdField })

/** An instant with its offset, so the agent states which local midnight it means. */
const instantField = z.iso.datetime({ offset: true })

export const listCompletedTasksToolInputSchema = z.object({
	from: instantField.describe(
		"Start of the range, inclusive: an ISO 8601 date-time with offset, usually the user's local midnight, e.g. 2026-11-17T00:00:00+01:00."
	),
	to: instantField.describe(
		'End of the range, exclusive, after `from`: an ISO 8601 date-time with offset.'
	),
})

/** `today` for the tools that complete or advance a task, required although the procedures take it as optional for older clients. */
const todayField = calendarDateSchema.describe(
	"The user's local date, YYYY-MM-DD, from the user's device or time zone; it places a repeating task's next occurrence. The server never guesses it."
)
const seenDueDateField = completeTaskInputSchema.shape.dueDate.describe(
	'The due date the task showed when you read it, YYYY-MM-DD. For a repeating task it keeps a second call from moving the task on twice, so a retry is safe; leave it out for a task without a due date.'
)
const loggedDueDateField = logProgressInputSchema.shape.dueDate.describe(
	'The due date the task showed when you read it, YYYY-MM-DD; a repeating task moves on only while it is still due then. It does not make a repeated call safe: every call adds, also to the next occurrence. Leave it out for a task without a due date.'
)
const labelIdField = taskLabelInputSchema.shape.labelId.describe(
	"The label's id, from list_labels."
)
const repeatFields = {
	unit: repeatInputSchema.shape.unit.describe(
		'How often it repeats: day, weekday (Monday to Friday), week, month or year.'
	),
	interval: repeatInputSchema.shape.interval.describe(
		'Every how many units, 1 or more; weekday and year take only 1.'
	),
	fromCompletion: repeatInputSchema.shape.fromCompletion.describe(
		'True counts the next due date from the day the task is completed ("every!"); false or absent counts from the due date.'
	),
}
const goalFields = {
	target: goalInputSchema.shape.target.describe(
		'How much completes the task, a whole number from 1.'
	),
	unit: goalInputSchema.shape.unit.describe(
		'What the progress counts, e.g. pages or km; absent for a plain count.'
	),
}
const taskFields = createTaskInputSchema.shape

export const createTaskToolInputSchema = z.object({
	title: taskFields.title.describe('The title, as the user would write it.'),
	description: taskFields.description.describe('Notes under the title.'),
	dueDate: taskFields.dueDate.describe(
		"The due date, YYYY-MM-DD, in the user's local calendar; absent for a task without one. A due time or a repeat rule needs it."
	),
	dueTime: taskFields.dueTime.describe(
		"The due time, HH:MM on a 24-hour clock in the user's local time."
	),
	durationMinutes: taskFields.durationMinutes.describe(
		'How long it takes, in minutes from 5 to 1440; needs `dueTime`.'
	),
	priority: taskFields.priority.describe(
		'1 is the most urgent, 4 the default.'
	),
	repeat: z
		.object(repeatFields)
		.optional()
		.describe(
			'Makes the task repeat from `dueDate`: completing it moves it to its next occurrence instead of closing it. A weekday rule on a weekend date starts on the next Monday.'
		),
	labelIds: taskFields.labelIds.describe(
		"Labels to add, from list_labels, each once; ids that are not the user's labels are skipped."
	),
	goal: z
		.object(goalFields)
		.optional()
		.describe(
			'A count to reach with log_progress, e.g. 30 pages; reaching it completes the task, or moves a repeating one to its next occurrence.'
		),
	projectId: taskFields.projectId.describe(
		'The project, from list_projects; absent puts the task in the Inbox. Not with `parentId`.'
	),
	parentId: taskFields.parentId.describe(
		"Makes it a subtask of this task, in that task's project. The parent must be open, at most 3 levels below a top-level task and hold fewer than 50 subtasks."
	),
})

const editFields = editTaskInputSchema.shape

export const updateTaskToolInputSchema = z.object({
	id: taskIdField,
	title: editFields.title.describe('A new title.'),
	description: editFields.description.describe('New notes; null clears them.'),
	dueDate: editFields.dueDate.describe(
		"A new due date, YYYY-MM-DD, in the user's local calendar; null clears it and with it the due time, duration and repeat rule. Required with a new `dueTime` or `repeat`: send the task's current due date to keep it."
	),
	dueTime: editFields.dueTime.describe(
		"A new due time, HH:MM on a 24-hour clock in local time, sent with `dueDate` (the task's current one to keep the date); null clears it and the duration."
	),
	durationMinutes: editFields.durationMinutes.describe(
		'A new duration in minutes from 5 to 1440, which needs a due time; null clears it.'
	),
	priority: editFields.priority.describe(
		'A new priority: 1 is the most urgent, 4 the default.'
	),
	repeat: z
		.object(repeatFields)
		.nullable()
		.optional()
		.describe(
			"A new repeat rule, sent with `dueDate` (the task's current one to keep the date); null stops the task repeating."
		),
	labelIds: editFields.labelIds.describe(
		"Replaces every label the task has with these, from list_labels; [] removes them all and ids that are not the user's labels are skipped. To add or take off one label, use assign_label or unassign_label."
	),
	goal: z
		.object(goalFields)
		.nullable()
		.optional()
		.describe(
			'A new goal, sent with `today`; its progress is kept up to the new target. null removes the goal and its progress. A target at or below the progress completes the task, or moves a repeating one to its next occurrence.'
		),
	projectId: editFields.projectId.describe(
		"A new project, from list_projects, which the task's subtasks follow; null moves the task to the Inbox. A subtask's project follows its top-level task and cannot be changed on its own."
	),
	today: editFields.today.describe(
		"The user's local date, YYYY-MM-DD, required with a new `goal`, which can complete a repeating task and place its next occurrence from it; the server never guesses it."
	),
})

export const completeTaskToolInputSchema = z.object({
	id: taskIdField,
	today: todayField,
	dueDate: seenDueDateField,
})

export const uncompleteTaskToolInputSchema = z.object({
	id: taskIdField,
	dueDate: uncompleteTaskInputSchema.shape.dueDate.describe(
		'The due date to put back, YYYY-MM-DD: for a repeating task that complete_task moved on, the one it had before, which moves its subtasks back too.'
	),
	progress: uncompleteTaskInputSchema.shape.progress.describe(
		'The goal progress to put back, as a `completed` result of update_task or log_progress reported it.'
	),
	goal: z
		.object(goalFields)
		.optional()
		.describe(
			'The goal to put back, as a `completed` result of update_task reported it.'
		),
})

export const rescheduleTasksToolInputSchema = z.object({
	ids: rescheduleTasksInputSchema.shape.ids.describe(
		'The tasks to move, from 1 to 1000 ids.'
	),
	dueDate: rescheduleTasksInputSchema.shape.dueDate.describe(
		"The new due date, YYYY-MM-DD, in the user's local calendar."
	),
})

export const taskLabelToolInputSchema = z.object({
	id: taskIdField,
	labelId: labelIdField,
})

export const logProgressToolInputSchema = z.object({
	id: taskIdField,
	amount: logProgressInputSchema.shape.amount.describe(
		"How much to add to the goal's progress, a whole number other than 0; negative takes some back."
	),
	today: todayField,
	dueDate: loggedDueDateField,
})
