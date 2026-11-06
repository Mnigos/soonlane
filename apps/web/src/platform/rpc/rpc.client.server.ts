import type { RouterContractClient } from '@orpc/contract'
import { createRouterClient } from '@orpc/server'
import type { Contract } from '@soonlist/contracts'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { runtime } from '@/platform/app.runtime'
import { createRpcContext } from '@/platform/rpc/rpc.context'
import { router } from '@/platform/rpc/rpc.router'

export function createInProcessRpcClient(): RouterContractClient<Contract> {
	return createRouterClient(router, {
		context: async () =>
			await createRpcContext(
				await runtime.context(),
				new Headers(getRequestHeaders())
			),
	})
}
