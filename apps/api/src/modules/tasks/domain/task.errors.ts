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
