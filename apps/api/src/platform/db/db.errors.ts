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

/** Drizzle wraps the driver error, so the violated constraint can sit several causes deep. */
export function isUniqueViolation(error: DbError, constraint: string) {
	return hasUniqueViolation(error.cause, constraint)
}

/** The first `code` down the cause chain: a Postgres SQLSTATE such as `42P01` or a Node code such as `ECONNREFUSED`. Drizzle wraps the driver error, so it can sit several causes deep. */
export function findDriverErrorCode(cause: unknown): string | undefined {
	if (typeof cause !== 'object' || cause === null) return undefined
	if ('code' in cause && typeof cause.code === 'string') return cause.code

	return 'cause' in cause ? findDriverErrorCode(cause.cause) : undefined
}
