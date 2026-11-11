import { ORPCError } from '@orpc/server'
import { DbError } from '../db/db.errors'

export interface ContractDomainError {
	readonly _tag: string
	readonly code: string
	readonly message: string
}

export type BoundaryError =
	| ContractDomainError
	| DbError
	| ORPCError<string, unknown>

const INTERNAL_KEYS = new Set([
	'_tag',
	'cause',
	'code',
	'message',
	'name',
	'stack',
])

const CONNECTION_ERROR_CODES = new Set([
	'08001',
	'08003',
	'08004',
	'08006',
	'ECONNREFUSED',
])

export function isBoundaryError(error: unknown): error is BoundaryError {
	if (error instanceof ORPCError || error instanceof DbError) return true

	return (
		typeof error === 'object' &&
		error !== null &&
		'_tag' in error &&
		'code' in error
	)
}

export function toORPCError(error: BoundaryError): ORPCError<string, unknown> {
	if (error instanceof ORPCError) return error
	if (error instanceof DbError) return toDbORPCError(error)

	return new ORPCError(error.code, {
		message: error.message,
		data: extractData(error),
	})
}

function extractData(error: object): Record<string, unknown> | undefined {
	const entries = Object.entries(error).filter(
		([key]) => !INTERNAL_KEYS.has(key)
	)

	if (entries.length === 0) return undefined

	return Object.fromEntries(entries)
}

function toDbORPCError(error: DbError): ORPCError<string, unknown> {
	if (isConnectionError(error.cause))
		return new ORPCError('SERVICE_UNAVAILABLE', {
			message: 'The database is temporarily unavailable.',
		})

	return new ORPCError('INTERNAL_SERVER_ERROR', {
		message: 'The operation failed. Try again.',
	})
}

/** Drizzle wraps the driver error, so the connection code can sit several causes deep. */
function isConnectionError(cause: unknown): boolean {
	if (typeof cause !== 'object' || cause === null) return false
	if (
		'code' in cause &&
		typeof cause.code === 'string' &&
		CONNECTION_ERROR_CODES.has(cause.code)
	)
		return true

	return 'cause' in cause && isConnectionError(cause.cause)
}
