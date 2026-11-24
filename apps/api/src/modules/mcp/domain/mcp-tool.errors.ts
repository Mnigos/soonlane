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
