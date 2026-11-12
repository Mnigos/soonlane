import type {
	GoalInput,
	Label,
	ListTasksOutput,
	Task,
} from '@soonlane/contracts'
import { TASK_PROJECT_FOREIGN_KEY } from '@soonlane/db'
import { type CalendarDate, getNextDueDate } from '@soonlane/domain'
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

/** From the date the client saw, so a stale list cannot advance the task twice. */
export function getAdvance(
	storedDueDate: CalendarDate,
	repeat: NonNullable<Task['repeat']>,
	{ today, dueDate }: CompletionDates
) {
	const from = dueDate ?? storedDueDate

	return { from, to: getNextDueDate(from, repeat, today) }
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

/** A view's open tasks, split at the client's today. */
export function splitAtToday(
	tasks: Task[],
	today: CalendarDate
): ListTasksOutput {
	return {
		overdue: tasks.filter(({ dueDate }) => dueDate < today),
		scheduled: tasks.filter(({ dueDate }) => dueDate >= today),
	}
}
