import { Data } from 'effect'

export class ProjectNotFound extends Data.TaggedError('ProjectNotFound') {
	readonly code = 'NOT_FOUND'

	override get message() {
		return 'This project no longer exists.'
	}
}

export class ProjectNameTaken extends Data.TaggedError('ProjectNameTaken') {
	readonly code = 'CONFLICT'

	override get message() {
		return 'A project with this name already exists.'
	}
}
