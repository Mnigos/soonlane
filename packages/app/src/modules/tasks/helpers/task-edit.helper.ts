import type { GoalInput, Label, RepeatInput, Task } from '@soonlane/contracts'
import {
	type CalendarDate,
	type TaskPriority,
	getEditedDueDate,
} from '@soonlane/domain'

/** The label ids an edit sends: undefined while they match the task's, so the save keeps them. */
export function getChangedLabelIds(task: Task, picked: Label[]) {
	const ids = picked.map(({ id }) => id)
	const isChanged =
		ids.length !== task.labels.length ||
		task.labels.some(({ id }) => !ids.includes(id))

	return isChanged ? ids : undefined
}

/** The goal an edit sends: undefined while it matches the task's, so the save keeps it; null removes it. */
export function getChangedGoal(task: Task, goal: GoalInput | undefined) {
	if (goal?.target === task.goal?.target && goal?.unit === task.goal?.unit)
		return undefined

	return goal ?? null
}

/** The rule an edit sends to keep the task's own, "every!" included. */
export function toRepeatInput(task: Task | undefined): RepeatInput | undefined {
	return (
		task?.repeat && {
			unit: task.repeat.unit,
			interval: task.repeat.interval,
			fromCompletion: task.repeat.fromCompletion,
		}
	)
}

/** Whether the edit's rule differs from the task's in unit, interval or "every!". */
export function isRepeatChanged(task: Task, repeat: RepeatInput | undefined) {
	return (
		repeat?.unit !== task.repeat?.unit ||
		repeat?.interval !== task.repeat?.interval ||
		(repeat?.fromCompletion ?? false) !== (task.repeat?.fromCompletion ?? false)
	)
}

/**
 * The `tasks.update` input of a task's "…" menu: the edit card's save with only the due date or the
 * priority changed, so a weekday rule moves a weekend pick to Monday and the goal and labels stay.
 * Undefined when the choice is what the task already has.
 */
export function getMenuEdit(
	task: Task,
	today: CalendarDate,
	change: { dueDate: CalendarDate } | { priority: TaskPriority }
) {
	const dueDate =
		'dueDate' in change
			? getEditedDueDate(task, change.dueDate, task.repeat?.unit)
			: task.dueDate
	const priority = 'priority' in change ? change.priority : task.priority

	if (dueDate === task.dueDate && priority === task.priority) return undefined

	return {
		id: task.id,
		title: task.title,
		description: task.description,
		dueDate,
		dueTime: task.dueTime,
		priority,
		repeat: toRepeatInput(task) ?? null,
		today,
	}
}
