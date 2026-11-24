import { z } from 'zod'
import {
	listTasksInputSchema,
	searchTasksInputSchema,
	taskIdInputSchema,
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
