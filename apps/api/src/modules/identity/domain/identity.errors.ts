import { ACCESS_ERROR_MESSAGES } from '@soonlane/domain'
import { Data } from 'effect'

export class Unauthorized extends Data.TaggedError('Unauthorized') {
	readonly code = 'UNAUTHORIZED'

	override get message() {
		return ACCESS_ERROR_MESSAGES.UNAUTHORIZED
	}
}
