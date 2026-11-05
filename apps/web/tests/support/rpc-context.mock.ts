import { Context } from 'effect'
import { AppConfig } from '@/platform/config/app.config'
import type { RpcContext } from '@/platform/rpc/rpc.context'

export function createTestContext(version?: string): RpcContext {
	const services = Context.make(AppConfig, {
		baseUrl: 'http://localhost:3000',
		trustedOrigins: ['http://localhost:3000'],
		version,
	})

	return { 'effect/context': services }
}
