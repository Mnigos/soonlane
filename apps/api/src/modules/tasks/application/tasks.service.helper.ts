import type {
	GoalInput,
	Label,
	ListTasksInput,
	ListTasksOutput,
	EditTaskInput,
	Task,
} from '@soonlane/contracts'
import { TASK_PROJECT_FOREIGN_KEY } from '@soonlane/db'
import {
	type CalendarDate,
	getEditedSchedule,
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

/** The schedule columns an edit writes: none when it carries neither a due date nor a rule; `nextDueDate` from the date and rule it leaves. */
export function getScheduleUpdate(
	current: Task,
	edit: EditTaskInput,
	today: CalendarDate | undefined
) {
	const { dueDate, repeat } = getEditedSchedule(current, edit)
	const isRuleWritten = edit.dueDate !== undefined || edit.repeat !== undefined

	return {
		dueDate: edit.dueDate === undefined ? undefined : (dueDate ?? null),
		dueTime: edit.dueDate === null ? null : edit.dueTime,
		repeat: isRuleWritten ? (repeat ?? null) : undefined,
		nextDueDate: repeat && dueDate && getNextDueDate(dueDate, repeat, today),
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
