import { Data } from 'effect'

export class DbError extends Data.TaggedError('DbError')<{
	readonly operation: string
	readonly cause: unknown
}> {}
