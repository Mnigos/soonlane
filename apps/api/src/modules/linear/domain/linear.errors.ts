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
