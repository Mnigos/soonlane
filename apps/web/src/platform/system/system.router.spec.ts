import { call } from '@orpc/server'
import { createTestContext } from '../../../tests/support/rpc-context.mock'
import { systemRouter } from './system.router'

test.each([
	['abc123', 'abc123'],
	[undefined, 'dev'],
])('reports health for version %s', async (version, expected) => {
	expect(
		await call(systemRouter.health, undefined, {
			context: createTestContext(version),
		})
	).toEqual({ ok: true, version: expected })
})
