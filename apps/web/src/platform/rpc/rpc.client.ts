import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { RouterContractClient } from '@orpc/contract'
import type { Contract } from '@soonlist/contracts'
import { createIsomorphicFn } from '@tanstack/react-start'
import { RPC_PREFIX } from './rpc-prefix.constants'
import { createInProcessRpcClient } from './rpc.client.server'

type RpcClient = RouterContractClient<Contract>

function createHttpRpcClient(): RpcClient {
	return createORPCClient(new RPCLink({ url: RPC_PREFIX }))
}

// SSR calls procedures in process with the incoming request's cookies, the browser over HTTP; the client build drops the in-process branch and its import.
const getRpcClient = createIsomorphicFn()
	.server(createInProcessRpcClient)
	.client(createHttpRpcClient)

export const rpc = getRpcClient()
