import type { GoalInput, Label, Task } from '@soonlane/contracts'

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
