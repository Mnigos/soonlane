import type { GoalInput, Task } from '@soonlane/contracts'
import { task, type TaskRow } from '@soonlane/db'
import type { CalendarDate } from '@soonlane/domain'
import { and, eq, inArray, isNotNull, isNull, ne, sql } from 'drizzle-orm'
import type { Database } from '@/platform/db/db.layer'
import { type OwnedTasks, ownedTasks } from './owned-tasks.query'
import type {
	DueDateAdvance,
	TaskCompletion,
	TaskKey,
} from './task.repository.types'

/** A due date moved by as many days as `to` lies after `from`; no due date stays none. */
function getShiftedDueDate({ from, to }: Omit<DueDateAdvance, keyof TaskKey>) {
	return sql`${task.dueDate} + (${to}::date - ${from}::date)`
}

/** Progress of a task being reopened, below its goal's target; a task without a goal keeps its progress. */
const REOPENED_PROGRESS = sql`case when ${task.goalProgress} >= ${task.goalTarget} then ${task.goalTarget} - 1 else ${task.goalProgress} end`

/**
 * Carries a write on the task down to its subtasks. Completing it stamps its open subtasks with its own `completedAt`, so
 * reopening it reopens exactly those, and its completed ancestors so no open task sits under a completed one; every task it
 * reopens drops below its goal's target, so its next edit or log does not complete or advance it again. Moving it to its
 * next occurrence from `advancedFrom` reopens every subtask at no progress and moves their dates along.
 */
export async function updateSubtree(
	tasks: OwnedTasks,
	previous: Pick<TaskRow, 'completedAt'>,
	{ id, completedAt, dueDate }: TaskRow,
	advancedFrom?: CalendarDate | null
) {
	const subtree = inArray(task.id, tasks.descendantsOf(id))

	if (completedAt && !previous.completedAt)
		await tasks.update({ completedAt }, and(subtree, isNull(task.completedAt)))
	if (previous.completedAt && !completedAt) {
		const reopened = { completedAt: null, goalProgress: REOPENED_PROGRESS }

		await tasks.update(
			reopened,
			and(
				subtree,
				sql`date_trunc('milliseconds', ${task.completedAt}) = ${previous.completedAt}`
			)
		)
		await tasks.update(
			reopened,
			and(
				inArray(task.id, tasks.lineageOf([id])),
				ne(task.id, id),
				isNotNull(task.completedAt)
			)
		)
	}
	if (advancedFrom && dueDate)
		await tasks.update(
			{
				completedAt: null,
				goalProgress: 0,
				dueDate: getShiftedDueDate({ from: advancedFrom, to: dueDate }),
			},
			subtree
		)
}

/** Clamped to the restored goal's target, or to the stored one; a task without a goal keeps 0, which its check requires. */
function getRestoredProgress(
	progress: number | undefined,
	goal: GoalInput | undefined
) {
	if (goal && progress !== undefined) return Math.min(progress, goal.target)
	if (goal) return sql`least(${task.goalProgress}, ${goal.target})`
	if (progress === undefined) return undefined

	return sql`least(${progress}, coalesce(${task.goalTarget}, 0))`
}

/**
 * Completes the task with its open subtasks, or reopens it with the subtasks completed with it. A restored due date (Undo of
 * an advance) moves the subtasks' dates back by as much; the subtasks the advance reopened stay open.
 */
export async function setCompletion(
	database: Database,
	{ ownerId, id, completedAt, dueDate, progress, goal }: TaskCompletion
): Promise<Task | undefined> {
	return await database.transaction(async transaction => {
		const tasks = ownedTasks(transaction, ownerId)
		const locked = await tasks.lockPath(id)

		if (!locked) return undefined
		if (dueDate && locked.dueDate && dueDate !== locked.dueDate)
			await tasks.update(
				{ dueDate: getShiftedDueDate({ from: locked.dueDate, to: dueDate }) },
				inArray(task.id, tasks.descendantsOf(id))
			)

		const [row] = await tasks
			.update(
				{
					completedAt: completedAt ? (locked.completedAt ?? completedAt) : null,
					dueDate,
					...(goal && { goalTarget: goal.target, goalUnit: goal.unit ?? null }),
					goalProgress: getRestoredProgress(progress, goal),
				},
				eq(task.id, id)
			)
			.returning()

		if (!row) return undefined

		await updateSubtree(tasks, locked, row)

		const [updated] = await tasks.withRelations([row])

		return updated
	})
}

/**
 * Moves an open repeating task from `from` to `to` with its subtasks. A concurrent completion that moved it first, or a
 * completed ancestor that completed it, leaves both as they are.
 */
export async function advanceDueDate(
	database: Database,
	{ ownerId, id, from, to }: DueDateAdvance
): Promise<Task | undefined> {
	return await database.transaction(async transaction => {
		const tasks = ownedTasks(transaction, ownerId)

		await tasks.lockPath(id)

		const [row] = await tasks
			.update(
				{ dueDate: to, goalProgress: 0 },
				and(
					eq(task.id, id),
					eq(task.dueDate, from),
					isNotNull(task.repeatUnit),
					isNull(task.completedAt)
				)
			)
			.returning()

		if (!row) return undefined

		await updateSubtree(tasks, row, row, from)

		const [advanced] = await tasks.withRelations([row])

		return advanced
	})
}
