import { Data } from 'effect'

export class TaskNotFound extends Data.TaggedError('TaskNotFound') {
	readonly code = 'NOT_FOUND'

	override get message() {
		return 'This task no longer exists.'
	}
}
