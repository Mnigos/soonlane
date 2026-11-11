import type { GoalInput, UpdateTaskOutput } from '@soonlane/contracts'
import { task, taskLabel } from '@soonlane/db'
import type { CalendarDate, LabelId, TaskId, UserId } from '@soonlane/domain'
import { and, eq, notInArray } from 'drizzle-orm'
import type { Database } from '@/platform/db/db.layer'
import type { TaskUpdate } from '../application/task-repository.port'
import { assignLabels, withLabels } from './task-labels.query'

type Transaction = Pick<Database, 'delete' | 'insert' | 'select' | 'update'>

/** An absent goal keeps the columns (but the progress of a task that moves on); null clears them; a new target clamps the progress, or resets it when the task moves on. */
function getGoalColumns(
	goal: GoalInput | null | undefined,
	progress: number,
	isAdvanced: boolean
) {
	if (goal === undefined) return isAdvanced ? { goalProgress: 0 } : {}
	if (goal === null)
		return { goalTarget: null, goalUnit: null, goalProgress: 0 }

	return {
		goalTarget: goal.target,
		goalUnit: goal.unit ?? null,
		goalProgress: isAdvanced ? 0 : Math.min(progress, goal.target),
	}
}

/** Whether the goal the edit leaves completes the task: it is open and its progress reaches the target. */
function isGoalReached(
	goal: Pick<GoalInput, 'target'> | null,
	previous: { progress: number; completedAt: Date | null }
) {
	if (!goal || previous.completedAt) return false

	return previous.progress >= goal.target
}

/** Replaces the task's labels with the owner's labels among `labelIds`. */
async function replaceLabels(
	transaction: Transaction,
	{
		ownerId,
		id,
		labelIds,
	}: { ownerId: UserId; id: TaskId; labelIds: LabelId[] }
) {
	await transaction
		.delete(taskLabel)
		.where(
			and(eq(taskLabel.taskId, id), notInArray(taskLabel.labelId, labelIds))
		)
	await assignLabels(transaction, ownerId, id, labelIds)
}

/** What Undo restores: the goal and progress before the edit, and the due date it completed on. */
function getCompleted(
	previous: { progress: number; target: number | null; unit: string | null },
	dueDate: CalendarDate
): UpdateTaskOutput['completed'] {
	if (previous.target === null) return undefined

	return {
		dueDate,
		progress: previous.progress,
		goal: { target: previous.target, unit: previous.unit ?? undefined },
	}
}

/**
 * Saves an edit on the row it locks first, so the goal's clamp sees the progress concurrent logs left and the
 * `task_goal_progress_range` check always holds. When the goal it leaves (new or kept) is at or below the progress of
 * an open task, the edit completes it like a log reaching the target: a repeating task moves to `nextDueDate` with no
 * progress, any other gets `completedAt`. So no open task sits at its target after an edit.
 */
export async function updateTask(
	transaction: Transaction,
	{
		ownerId,
		id,
		title,
		description,
		dueDate,
		dueTime,
		priority,
		repeat,
		labelIds,
		goal,
		nextDueDate,
		editedAt,
	}: TaskUpdate
): Promise<UpdateTaskOutput | undefined> {
	const where = and(eq(task.ownerId, ownerId), eq(task.id, id))
	const [previous] = await transaction
		.select({
			progress: task.goalProgress,
			target: task.goalTarget,
			unit: task.goalUnit,
			completedAt: task.completedAt,
		})
		.from(task)
		.where(where)
		.for('update')

	if (!previous) return undefined

	const kept = previous.target === null ? null : { target: previous.target }
	const isCompleted = isGoalReached(goal === undefined ? kept : goal, previous)
	const isAdvanced = isCompleted && nextDueDate !== undefined
	const [row] = await transaction
		.update(task)
		.set({
			title,
			description: description || null,
			dueDate: isAdvanced ? nextDueDate : dueDate,
			dueTime: dueTime ?? null,
			priority,
			repeatUnit: repeat?.unit ?? null,
			repeatInterval: repeat?.interval ?? null,
			repeatAnchor: repeat?.anchor ?? null,
			completedAt: isCompleted && !isAdvanced ? editedAt : undefined,
			...getGoalColumns(goal, previous.progress, isAdvanced),
		})
		.where(where)
		.returning()

	if (!row) return undefined
	if (labelIds) await replaceLabels(transaction, { ownerId, id, labelIds })

	const [updated] = await withLabels(transaction, ownerId, [row])

	return (
		updated && {
			task: updated,
			completed: isCompleted ? getCompleted(previous, dueDate) : undefined,
		}
	)
}
