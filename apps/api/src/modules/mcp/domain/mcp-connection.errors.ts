import { Data } from 'effect'

export class McpConnectionNotFound extends Data.TaggedError(
	'McpConnectionNotFound'
) {
	readonly code = 'NOT_FOUND'

	override get message() {
		return 'This agent is no longer connected.'
	}
}
