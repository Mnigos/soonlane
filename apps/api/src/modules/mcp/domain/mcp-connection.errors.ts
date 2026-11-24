import { Data } from 'effect'

export class McpConnectionNotFound extends Data.TaggedError(
	'McpConnectionNotFound'
) {
	readonly code = 'NOT_FOUND'

	override get message() {
		return 'This agent is no longer connected.'
	}
}

/** A valid token whose connection is gone, or was allowed again after the token was issued; answered like an invalid token. */
export class McpClientNotConnected extends Data.TaggedError(
	'McpClientNotConnected'
) {
	readonly code = 'UNAUTHORIZED'

	override get message() {
		return 'This agent is no longer connected to Soonlane, so reconnect it in your AI app.'
	}
}

export class McpRequestLimitReached extends Data.TaggedError(
	'McpRequestLimitReached'
) {
	readonly code = 'TOO_MANY_REQUESTS'

	override get message() {
		return 'Your agents sent too many requests, so try again in a minute.'
	}
}
