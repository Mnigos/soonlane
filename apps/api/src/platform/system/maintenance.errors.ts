import { MAINTENANCE_ERROR } from '@soonlane/contracts'
import { Data } from 'effect'

export class Maintenance extends Data.TaggedError('Maintenance') {
	readonly code = MAINTENANCE_ERROR.code

	override get message() {
		return MAINTENANCE_ERROR.message
	}
}
