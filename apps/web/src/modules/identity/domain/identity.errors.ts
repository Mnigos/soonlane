import { ACCESS_ERROR_MESSAGES } from '@soonlist/domain'
import { Data } from 'effect'

export class Unauthorized extends Data.TaggedError('Unauthorized') {
	readonly code = 'UNAUTHORIZED'

	override get message() {
		return ACCESS_ERROR_MESSAGES.UNAUTHORIZED
	}
}

export class Forbidden extends Data.TaggedError('Forbidden') {
	readonly code = 'FORBIDDEN'

	override get message() {
		return ACCESS_ERROR_MESSAGES.FORBIDDEN
	}
}
