import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { RouterContractClient } from '@orpc/contract'
import type { Contract } from '@soonlane/contracts'
import { createIsomorphicFn } from '@tanstack/react-start'
import { RPC_PREFIX } from './rpc-prefix.constants'
import { fetchAsVisitor, getRequestOrigin } from './rpc.client.server'

/** `VITE_API_URL`, the API's origin; unset, the app's own. */
const API_ORIGIN = import.meta.env.VITE_API_URL

/** The server needs an absolute URL; the browser can stay relative. */
const getApiOrigin = createIsomorphicFn()
	.server(() => API_ORIGIN ?? getRequestOrigin())
	.client(() => API_ORIGIN)

const fetchApi = createIsomorphicFn()
	.server(fetchAsVisitor)
	.client(
		async (url: string, init: RequestInit) =>
			await fetch(url, { ...init, credentials: 'include' })
	)

export const rpc: RouterContractClient<Contract> = createORPCClient(
	new RPCLink({ url: RPC_PREFIX, origin: getApiOrigin, fetch: fetchApi })
)
