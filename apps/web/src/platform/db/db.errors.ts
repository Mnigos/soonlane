import { Data } from 'effect'

export class DbError extends Data.TaggedError('DbError')<{
	readonly operation: string
	readonly cause: unknown
}> {}

const UNIQUE_VIOLATION_CODE = '23505'

// Drizzle wraps the driver error, so the violated constraint can sit several causes deep.
export function isUniqueViolation(error: DbError, constraint: string): boolean {
	let { cause } = error

	while (typeof cause === 'object' && cause !== null) {
		if (
			'code' in cause &&
			cause.code === UNIQUE_VIOLATION_CODE &&
			'constraint' in cause &&
			cause.constraint === constraint
		)
			return true

		cause = 'cause' in cause ? cause.cause : undefined
	}

	return false
}
