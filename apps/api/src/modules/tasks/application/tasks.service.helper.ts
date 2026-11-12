import type {
	GoalInput,
	Label,
	ListTasksInput,
	ListTasksOutput,
	Task,
	UpdateTaskInput,
} from '@soonlane/contracts'
import { TASK_PROJECT_FOREIGN_KEY } from '@soonlane/db'
import {
	type CalendarDate,
	getEditedDueDate,
	getEditedRule,
	getNextDueDate,
} from '@soonlane/domain'
import { Effect } from 'effect'
import { LabelNotFound } from '@/modules/labels/domain/label.errors'
import { ProjectNotFound } from '@/modules/projects/domain/project.errors'
import { type DbError, isForeignKeyViolation } from '@/platform/db/db.errors'
import { TaskNotFound } from '../domain/task.errors'

/** The client's today and the due date it showed; both absent from older clients. */
export interface CompletionDates {
	today?: CalendarDate
	dueDate?: CalendarDate
}

export interface RestoredOccurrence {
	dueDate?: CalendarDate
	progress?: number
	goal?: GoalInput
}

/** From the date the client saw, so a stale list cannot advance the task twice; `undefined` for a task that does not repeat. */
export function getAdvance(
	{ dueDate: storedDueDate, repeat }: Task,
	{ today, dueDate }: CompletionDates
) {
	if (!repeat || storedDueDate === undefined) return undefined

	const from = dueDate ?? storedDueDate

	return { from, to: getNextDueDate(from, repeat, today) }
}

/** A task without a due date keeps no repeat rule, even when the edit leaves `repeat` out to keep the stored one. */
export function getEditedSchedule(
	current: Task,
	{ dueDate: editedDate, repeat: editedRepeat }: UpdateTaskInput,
	today: CalendarDate | undefined
) {
	if (editedDate === undefined)
		return { dueDate: null, repeat: undefined, nextDueDate: undefined }

	const repeat =
		editedRepeat === undefined ? current.repeat : (editedRepeat ?? undefined)
	const dueDate = getEditedDueDate(current, editedDate, repeat?.unit)
	const rule = getEditedRule(current, dueDate, repeat)

	return {
		dueDate,
		repeat: rule,
		nextDueDate: rule && getNextDueDate(dueDate, rule, today),
	}
}

export function requireTask<T>(task: T | undefined) {
	return task ? Effect.succeed(task) : Effect.fail(new TaskNotFound())
}

export function requireLabel(label: Label | undefined) {
	return label ? Effect.succeed(label) : Effect.fail(new LabelNotFound())
}

/** The project passed the owner check but was deleted before the write. */
export function failDeletedProject(error: DbError) {
	return Effect.fail(
		isForeignKeyViolation(error, TASK_PROJECT_FOREIGN_KEY)
			? new ProjectNotFound()
			: error
	)
}

/** A view's open tasks: those without a due date (only those without a project, the Inbox, for an unfiltered view), then the rest split at the client's today. */
export function splitAtToday(
	tasks: Task[],
	{ today, labelId, projectId }: ListTasksInput
): ListTasksOutput {
	const isFiltered = labelId !== undefined || projectId !== undefined

	return {
		undated: tasks.filter(
			({ dueDate, project }) =>
				dueDate === undefined && (isFiltered || project === undefined)
		),
		overdue: tasks.filter(
			({ dueDate }) => dueDate !== undefined && dueDate < today
		),
		scheduled: tasks.filter(
			({ dueDate }) => dueDate !== undefined && dueDate >= today
		),
	}
}
