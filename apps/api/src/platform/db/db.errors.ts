import { Data } from 'effect'

export class DbError extends Data.TaggedError('DbError')<{
	readonly operation: string
	readonly cause: unknown
}> {}

const UNIQUE_VIOLATION_CODE = '23505'
const FOREIGN_KEY_VIOLATION_CODE = '23503'
const CHECK_VIOLATION_CODE = '23514'

function hasViolation(
	cause: unknown,
	code: string,
	constraint: string
): boolean {
	if (typeof cause !== 'object' || cause === null) return false
	if (
		'code' in cause &&
		cause.code === code &&
		'constraint' in cause &&
		cause.constraint === constraint
	)
		return true

	return 'cause' in cause && hasViolation(cause.cause, code, constraint)
}

/** Drizzle wraps the driver error, so the violated constraint can sit several causes deep. */
export function isUniqueViolation(error: DbError, constraint: string) {
	return hasViolation(error.cause, UNIQUE_VIOLATION_CODE, constraint)
}

/** A write that references a row another transaction deleted in the meantime. */
export function isForeignKeyViolation(error: DbError, constraint: string) {
	return hasViolation(error.cause, FOREIGN_KEY_VIOLATION_CODE, constraint)
}

/** A write another request made invalid in the meantime, e.g. by clearing a field the check needs. */
export function isCheckViolation(error: DbError, constraint: string) {
	return hasViolation(error.cause, CHECK_VIOLATION_CODE, constraint)
}

/** The first `code` down the cause chain: a Postgres SQLSTATE such as `42P01` or a Node code such as `ECONNREFUSED`. Drizzle wraps the driver error, so it can sit several causes deep. */
export function findDriverErrorCode(cause: unknown): string | undefined {
	if (typeof cause !== 'object' || cause === null) return undefined
	if ('code' in cause && typeof cause.code === 'string') return cause.code

	return 'cause' in cause ? findDriverErrorCode(cause.cause) : undefined
}
