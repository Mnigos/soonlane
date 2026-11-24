import { Data } from 'effect'

/** Tool arguments the JSON Schema let through and the procedure's own schema refuses, such as a range that ends before it starts. */
export class McpToolInputInvalid extends Data.TaggedError(
	'McpToolInputInvalid'
)<{ readonly issue: string }> {
	readonly code = 'BAD_REQUEST'

	override get message() {
		return this.issue
	}
}

/** A write tool called on a connection the user allowed only to see tasks; the message tells the user how to allow more. */
export class McpToolNeedsWriteScope extends Data.TaggedError(
	'McpToolNeedsWriteScope'
) {
	readonly code = 'FORBIDDEN'

	override get message() {
		return 'This agent can only see your tasks, so reconnect it and tick the option to add, edit and complete tasks.'
	}
}
