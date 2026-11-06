import { Data } from 'effect'

export class FrameStoreError extends Data.TaggedError('FrameStoreError')<{
	readonly operation: 'read' | 'write'
	readonly cause: unknown
}> {}
