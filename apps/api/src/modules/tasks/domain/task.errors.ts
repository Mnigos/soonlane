import { SUBTASK_DEPTH_MAX, SUBTASKS_PER_TASK_MAX } from '@soonlane/domain'
import { Data } from 'effect'

export class TaskNotFound extends Data.TaggedError('TaskNotFound') {
	readonly code = 'NOT_FOUND'

	override get message() {
		return 'This task no longer exists.'
	}
}

export class TaskDurationWithoutTime extends Data.TaggedError(
	'TaskDurationWithoutTime'
) {
	readonly code = 'BAD_REQUEST'

	override get message() {
		return 'A duration needs a due time.'
	}
}

export class SubtaskTooDeep extends Data.TaggedError('SubtaskTooDeep') {
	readonly code = 'CONFLICT'

	override get message() {
		return `Subtasks can be nested up to ${SUBTASK_DEPTH_MAX} levels deep.`
	}
}

export class SubtaskLimitReached extends Data.TaggedError(
	'SubtaskLimitReached'
) {
	readonly code = 'CONFLICT'

	override get message() {
		return `A task can have up to ${SUBTASKS_PER_TASK_MAX} subtasks, including completed ones.`
	}
}

export class ParentTaskCompleted extends Data.TaggedError(
	'ParentTaskCompleted'
) {
	readonly code = 'CONFLICT'

	override get message() {
		return 'Reopen this completed task to add a subtask.'
	}
}

export class SubtaskProjectLocked extends Data.TaggedError(
	'SubtaskProjectLocked'
) {
	readonly code = 'BAD_REQUEST'

	override get message() {
		return 'Subtasks stay with their top-level task, so change its project instead.'
	}
}

/** Why a parent the owner has took no subtask. */
export type SubtaskRefusal =
	| SubtaskTooDeep
	| ParentTaskCompleted
	| SubtaskLimitReached

/** An edit the task cannot take as sent. */
export type InvalidTaskEdit = TaskDurationWithoutTime | SubtaskProjectLocked
