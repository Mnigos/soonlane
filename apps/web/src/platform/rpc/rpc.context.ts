import type { WithEffectContext } from '@orpc/experimental-effect'
import type { Context } from 'effect'
import type { AppServices } from '../app.runtime'

export type RpcContext = WithEffectContext<AppServices>

export async function createRpcContext(
	services: Context.Context<AppServices>,
	_headers: Headers
): Promise<RpcContext> {
	return { 'effect/context': services }
}
