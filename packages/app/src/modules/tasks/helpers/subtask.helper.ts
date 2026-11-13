import type { Task } from '@soonlane/contracts'
import { SUBTASK_DEPTH_MAX, SUBTASKS_PER_TASK_MAX } from '@soonlane/domain'

/** Why "Add subtask" is disabled on a task that has the most direct subtasks. */
export const SUBTASK_LIMIT_HINT = `A task can have up to ${SUBTASKS_PER_TASK_MAX} subtasks, including completed ones.`

/** Whether an open task offers "Add subtask": never at the deepest level, disabled once it has the most direct subtasks. */
export function getAddSubtaskState({
	depth,
	subtasks,
}: Pick<Task, 'depth' | 'subtasks'>) {
	if (depth >= SUBTASK_DEPTH_MAX) return 'hidden'

	return (subtasks?.total ?? 0) >= SUBTASKS_PER_TASK_MAX ? 'full' : 'available'
}
