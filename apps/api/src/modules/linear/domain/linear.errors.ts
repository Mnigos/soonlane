import { LINEAR_PINS_PER_TASK_MAX } from '@soonlane/domain'
import { Data } from 'effect'

export class LinearNotConfigured extends Data.TaggedError(
	'LinearNotConfigured'
) {
	readonly code = 'NOT_IMPLEMENTED'

	override get message() {
		return 'Linear is not set up.'
	}
}

/** Linear no longer accepts the stored grant, or this server can no longer decrypt it; status reads it as lapsed and the user reconnects. */
export class LinearConnectionLapsed extends Data.TaggedError(
	'LinearConnectionLapsed'
) {}

/** Carries nothing from the failed request: no URL, token or response body. */
export class LinearReadFailed extends Data.TaggedError('LinearReadFailed') {
	readonly code = 'BAD_GATEWAY'

	override get message() {
		return 'Linear could not be read.'
	}
}

/** A connection whose revocation Linear has not confirmed; it stays so the user can retry. */
export class LinearStillConnected extends Data.TaggedError(
	'LinearStillConnected'
) {
	readonly code = 'SERVICE_UNAVAILABLE'

	override get message() {
		return 'The Linear connection could not be closed.'
	}
}

/** A read that needs Linear found no usable connection: none, lapsed, or no Linear app on this server. */
export class LinearNotConnected extends Data.TaggedError('LinearNotConnected') {
	readonly code = 'PRECONDITION_FAILED'

	override get message() {
		return 'Linear is not connected.'
	}
}

export class LinearIssueNotFound extends Data.TaggedError(
	'LinearIssueNotFound'
) {
	readonly code = 'NOT_FOUND'

	override get message() {
		return 'This Linear issue is not available.'
	}
}

export class LinearPinLimitReached extends Data.TaggedError(
	'LinearPinLimitReached'
) {
	readonly code = 'CONFLICT'

	override get message() {
		return `A task can pin up to ${LINEAR_PINS_PER_TASK_MAX} Linear issues.`
	}
}
