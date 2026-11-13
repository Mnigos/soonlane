import type { GoalInput, UpdateTaskOutput } from '@soonlane/contracts'
import { type TaskRow, task, taskLabel } from '@soonlane/db'
import type { CalendarDate, LabelId, TaskId, UserId } from '@soonlane/domain'
import { and, eq, notInArray } from 'drizzle-orm'
import { ownedBy, ownedTasks, type Queries } from './owned-tasks.query'
import { toRepeatColumns } from './task.mapper'
import type { TaskUpdate } from './task.repository.types'

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
	previous: TaskRow
) {
	if (!goal || previous.completedAt) return false

	return previous.goalProgress >= goal.target
}

/** Replaces the task's labels with the owner's labels among `labelIds`. */
async function replaceLabels(
	transaction: Queries,
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
	await ownedTasks(transaction, ownerId).assignLabels(id, labelIds)
}

/** What Undo restores: the goal and progress before the edit, and the due date it completed on. */
function getCompleted(
	previous: TaskRow,
	dueDate: CalendarDate | null
): UpdateTaskOutput['completed'] {
	if (previous.goalTarget === null) return undefined

	return {
		dueDate: dueDate ?? undefined,
		progress: previous.goalProgress,
		goal: { target: previous.goalTarget, unit: previous.goalUnit ?? undefined },
	}
}

/**
 * Saves an edit on the row it locks first, so the goal's clamp sees the progress concurrent logs left and the
 * `task_goal_progress_range` check always holds. When the goal it leaves (new or kept) is at or below the progress of
 * an open task, the edit completes it like a log reaching the target: a repeating task moves to `nextDueDate` with no
 * progress, any other gets `completedAt`. So no open task sits at its target after an edit. Writes only the columns the edit carries.
 */
export async function updateTask(
	transaction: Queries,
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
		projectId,
		nextDueDate,
		editedAt,
	}: TaskUpdate
): Promise<UpdateTaskOutput | undefined> {
	const where = and(ownedBy(ownerId), eq(task.id, id))
	const [previous] = await transaction
		.select()
		.from(task)
		.where(where)
		.for('update')

	if (!previous) return undefined

	const kept =
		previous.goalTarget === null ? null : { target: previous.goalTarget }
	const isCompleted = isGoalReached(goal === undefined ? kept : goal, previous)
	const isAdvanced = isCompleted && nextDueDate !== undefined
	const columns = {
		title,
		description: description === undefined ? undefined : description || null,
		dueDate: isAdvanced ? nextDueDate : dueDate,
		dueTime,
		priority,
		...(repeat === undefined ? {} : toRepeatColumns(repeat ?? undefined)),
		completedAt: isCompleted && !isAdvanced ? editedAt : undefined,
		...getGoalColumns(goal, previous.goalProgress, isAdvanced),
		projectId,
	}
	// Drizzle refuses an empty set, e.g. for an edit of the labels only.
	const [row] = Object.values(columns).some(value => value !== undefined)
		? await transaction.update(task).set(columns).where(where).returning()
		: [previous]

	if (!row) return undefined
	if (labelIds) await replaceLabels(transaction, { ownerId, id, labelIds })

	const [updated] = await ownedTasks(transaction, ownerId).withLabelsAndProject(
		[row]
	)

	return (
		updated && {
			task: updated,
			completed: isCompleted
				? getCompleted(
						previous,
						dueDate === undefined ? previous.dueDate : dueDate
					)
				: undefined,
		}
	)
}
