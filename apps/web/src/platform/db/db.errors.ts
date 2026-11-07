import { Data } from 'effect'

export class DbError extends Data.TaggedError('DbError')<{
	readonly operation: string
	readonly cause: unknown
}> {}

const UNIQUE_VIOLATION_CODE = '23505'

function hasUniqueViolation(cause: unknown, constraint: string): boolean {
	if (typeof cause !== 'object' || cause === null) return false
	if (
		'code' in cause &&
		cause.code === UNIQUE_VIOLATION_CODE &&
		'constraint' in cause &&
		cause.constraint === constraint
	)
		return true

	return 'cause' in cause && hasUniqueViolation(cause.cause, constraint)
}

// Drizzle wraps the driver error, so the violated constraint can sit several causes deep.
export function isUniqueViolation(error: DbError, constraint: string) {
	return hasUniqueViolation(error.cause, constraint)
}
