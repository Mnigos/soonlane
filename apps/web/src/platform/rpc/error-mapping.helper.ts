import { ORPCError } from '@orpc/server'

export interface ContractDomainError {
	readonly _tag: string
	readonly code: string
	readonly message: string
}

export type BoundaryError = ContractDomainError | ORPCError<string, unknown>

const INTERNAL_KEYS = new Set([
	'_tag',
	'cause',
	'code',
	'message',
	'name',
	'stack',
])

export function isBoundaryError(error: unknown): error is BoundaryError {
	if (error instanceof ORPCError) return true

	return (
		typeof error === 'object' &&
		error !== null &&
		'_tag' in error &&
		'code' in error
	)
}

export function toORPCError(error: BoundaryError): ORPCError<string, unknown> {
	if (error instanceof ORPCError) return error

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
