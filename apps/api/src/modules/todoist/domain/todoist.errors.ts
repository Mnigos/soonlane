import { Data } from 'effect'

/** Only the name: driver errors embed SQL parameters, and fetch failures can carry a URL. */
export function toErrorName(error: unknown) {
	return error instanceof Error ? error.name : typeof error
}

export class TodoistNotConfigured extends Data.TaggedError(
	'TodoistNotConfigured'
) {
	readonly code = 'NOT_IMPLEMENTED'

	override get message() {
		return 'Importing from Todoist is not set up.'
	}
}

export class TodoistNotConnected extends Data.TaggedError(
	'TodoistNotConnected'
) {
	readonly code = 'NOT_FOUND'

	override get message() {
		return 'No Todoist account is connected.'
	}
}

export class TodoistConnectionExpired extends Data.TaggedError(
	'TodoistConnectionExpired'
) {
	readonly code = 'GONE'

	override get message() {
		return 'The Todoist connection expired.'
	}
}

/** A connection whose revocation Todoist has not confirmed yet; it stays for the sweep. */
export class TodoistStillConnected extends Data.TaggedError(
	'TodoistStillConnected'
) {
	readonly code = 'SERVICE_UNAVAILABLE'

	override get message() {
		return 'The Todoist connection could not be closed yet.'
	}
}

/** Carries nothing from the failed request: no URL, token or response body. */
export class TodoistReadFailed extends Data.TaggedError('TodoistReadFailed') {
	readonly code = 'BAD_GATEWAY'

	override get message() {
		return 'Todoist could not be read.'
	}
}
