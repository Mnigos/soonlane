import { call, ORPCError } from '@orpc/server'
import { Data, Effect } from 'effect'
import { createTestContext } from '../../../tests/support/rpc-context.mock'
import { isBoundaryError, toORPCError } from './error-mapping.helper'
import { os } from './rpc.base'

class ProbeFailure extends Data.TaggedError('ProbeFailure') {
	readonly code = 'FORBIDDEN'

	override get message() {
		return 'Public probe message'
	}
}

const context = createTestContext()

describe('RPC error mapping', () => {
	test('maps a tagged failure through the middleware', async () => {
		const probe = os.system.health.effect(function* () {
			return yield* new ProbeFailure()
		})
		const promise = call(probe, undefined, { context })
		await expect(promise).rejects.toBeInstanceOf(ORPCError)
		await expect(promise).rejects.toMatchObject({
			code: 'FORBIDDEN',
			message: 'Public probe message',
		})
	})

	test('preserves existing ORPCError instances', async () => {
		const error = new ORPCError('FORBIDDEN', { message: 'Already mapped' })
		const probe = os.system.health.effect(function* () {
			return yield* Effect.fail(error)
		})
		expect(toORPCError(error)).toBe(error)
		await expect(call(probe, undefined, { context })).rejects.toMatchObject({
			code: 'FORBIDDEN',
			message: 'Already mapped',
		})
	})

	test('keeps public error data while stripping internal fields', () => {
		const domainError = {
			_tag: 'ExampleFailure',
			code: 'FORBIDDEN',
			message: 'Public message',
			name: 'Internal name',
			stack: 'Internal stack',
			cause: 'Internal cause',
			taskId: 'task-1',
		}
		const error = toORPCError(domainError)
		expect(error.data).toEqual({ taskId: 'task-1' })
		expect(toORPCError(new ProbeFailure()).data).toBeUndefined()
	})

	test.each([
		null,
		undefined,
		'UNAUTHORIZED',
		new Error('unexpected'),
		{ code: 'FORBIDDEN' },
		{ _tag: 'Incomplete' },
	])('does not classify an untagged error as a domain error: %j', error => {
		expect(isBoundaryError(error)).toBe(false)
	})

	test('does not turn an unexpected failure into an access-denied error', async () => {
		const failure = new Error('unexpected')
		const probe = os.system.health.effect(function* () {
			return yield* Effect.fail(failure)
		})
		await expect(call(probe, undefined, { context })).rejects.toBe(failure)
	})
})
