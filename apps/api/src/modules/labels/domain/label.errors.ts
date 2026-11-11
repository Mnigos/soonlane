import { Data } from 'effect'

export class LabelNotFound extends Data.TaggedError('LabelNotFound') {
	readonly code = 'NOT_FOUND'

	override get message() {
		return 'This label no longer exists.'
	}
}

export class LabelNameTaken extends Data.TaggedError('LabelNameTaken') {
	readonly code = 'CONFLICT'

	override get message() {
		return 'A label with this name already exists.'
	}
}
