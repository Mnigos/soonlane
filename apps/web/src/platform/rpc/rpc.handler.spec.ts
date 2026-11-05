import { createTestContext } from '../../../tests/support/rpc-context.mock'
import { createRpcHandler } from './rpc.handler'

function createRequest(path: string, headers?: HeadersInit) {
	const requestHeaders = new Headers(headers)
	requestHeaders.set('content-type', 'application/json')
	return new Request(`http://localhost:3000/api/rpc/${path}`, {
		method: 'POST',
		headers: requestHeaders,
		body: JSON.stringify({ json: null }),
	})
}

describe('createRpcHandler', () => {
	test('answers system.health through the Effect context', async () => {
		const response = await createRpcHandler(async () =>
			createTestContext('abc123')
		)(createRequest('system/health'))
		expect(response.status).toBe(200)
		expect(await response.json()).toEqual({
			json: { ok: true, version: 'abc123' },
		})
	})

	test('reports the dev version without a deployed commit', async () => {
		const response = await createRpcHandler(async () => createTestContext())(
			createRequest('system/health')
		)
		expect(await response.json()).toEqual({
			json: { ok: true, version: 'dev' },
		})
	})

	test('passes the original request to the context builder', async () => {
		const buildContext = vi.fn<Parameters<typeof createRpcHandler>[0]>(
			async () => createTestContext()
		)
		const request = createRequest('system/health', {
			cookie: 'test-cookie=opaque',
		})
		const response = await createRpcHandler(buildContext)(request)
		expect(buildContext).toHaveBeenCalledExactlyOnceWith(request)
		expect(response.status).toBe(200)
	})

	test('rejects a foreign origin before building context', async () => {
		const buildContext = vi.fn<Parameters<typeof createRpcHandler>[0]>(
			async () => createTestContext()
		)
		const response = await createRpcHandler(buildContext)(
			createRequest('system/health', { origin: 'https://evil.example' })
		)
		expect(response.status).toBe(403)
		expect(buildContext).not.toHaveBeenCalled()
	})

	test('accepts the same origin', async () => {
		const response = await createRpcHandler(async () => createTestContext())(
			createRequest('system/health', { origin: 'http://localhost:3000' })
		)
		expect(response.status).toBe(200)
	})

	test.each([
		'https://soonlist.vercel.app',
		'https://soonlist-git-feature-team.vercel.app',
	])('accepts the trusted origin %s behind an HTTP proxy', async origin => {
		const response = await createRpcHandler(
			async () => createTestContext(),
			async () => [
				'https://soonlist.vercel.app/',
				'https://soonlist-git-feature-team.vercel.app',
			]
		)(createRequest('system/health', { origin }))
		expect(response.status).toBe(200)
	})

	test.each([
		'https://evil.example',
		'https://soonlist.vercel.app.evil.example',
		'http://soonlist.vercel.app',
		'https://soonlist.vercel.app:444',
		'null',
	])('rejects foreign origin %s even with trusted origins', async origin => {
		const buildContext = vi.fn(async () => createTestContext())
		const response = await createRpcHandler(buildContext, async () => [
			'https://soonlist.vercel.app',
		])(
			createRequest('system/health', {
				origin,
				'x-forwarded-host': 'soonlist.vercel.app',
				'x-forwarded-proto': 'https',
			})
		)
		expect(response.status).toBe(403)
		expect(await response.text()).toBe('Forbidden')
		expect(buildContext).not.toHaveBeenCalled()
	})

	test('returns 404 for an unknown RPC path', async () => {
		const response = await createRpcHandler(async () => createTestContext())(
			createRequest('missing')
		)
		expect(response.status).toBe(404)
	})

	test('rejects GET so procedures cannot be triggered by a plain link', async () => {
		const response = await createRpcHandler(async () => createTestContext())(
			new Request('http://localhost:3000/api/rpc/system/health')
		)
		expect(response.status).toBe(404)
	})

	test.each(['provider rejection', 'invalid trusted origin'])(
		'hides origin-check failures behind a 503 response: %s',
		async failure => {
			const buildContext = vi.fn(async () => createTestContext())
			const getTrustedOrigins = vi.fn(async () => {
				if (failure === 'provider rejection')
					throw new Error('synthetic-private-provider-failure', {
						cause: new Error('synthetic-private-nested-token'),
					})
				return ['synthetic-private-invalid-url']
			})
			const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
			const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
			try {
				const response = await createRpcHandler(
					buildContext,
					getTrustedOrigins
				)(
					createRequest('system/health', {
						origin: 'https://soonlist.vercel.app',
					})
				)
				expect(response.status).toBe(503)
				expect(await response.json()).toEqual({
					message: 'The service is temporarily unavailable.',
				})
				expect(getTrustedOrigins).toHaveBeenCalledOnce()
				expect(buildContext).not.toHaveBeenCalled()
				const output = JSON.stringify([
					...logSpy.mock.calls,
					...errorSpy.mock.calls,
				])
				expect(output).toContain('RPC request failed')
				expect(output).not.toContain('synthetic-private-provider-failure')
				expect(output).not.toContain('synthetic-private-nested-token')
				expect(output).not.toContain('synthetic-private-invalid-url')
			} finally {
				logSpy.mockRestore()
				errorSpy.mockRestore()
			}
		}
	)

	test('hides context-building failures behind a 503 response', async () => {
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
		const handle = createRpcHandler(async () => {
			throw new Error('private infrastructure details', {
				cause: new Error('nested session token'),
			})
		})
		try {
			const response = await handle(createRequest('system/health'))
			expect(response.status).toBe(503)
			const output = JSON.stringify([
				...logSpy.mock.calls,
				...errorSpy.mock.calls,
			])
			expect(output).toContain('RPC request failed')
			expect(output).not.toContain('private infrastructure details')
			expect(output).not.toContain('nested session token')
		} finally {
			logSpy.mockRestore()
			errorSpy.mockRestore()
		}
	})
})
