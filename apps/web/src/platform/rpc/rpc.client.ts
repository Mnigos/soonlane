import { RPCLink } from '@orpc/client/fetch'
import { createIsomorphicFn } from '@tanstack/react-start'
import { RPC_PREFIX } from './rpc-prefix.constants'
import { fetchAsVisitor, getInternalApiOrigin } from './rpc.client.server'

/** `VITE_API_URL`, the API's public origin, which the browser calls directly with its cookies. */
const API_ORIGIN = import.meta.env.VITE_API_URL

const getApiOrigin = createIsomorphicFn()
	.server(getInternalApiOrigin)
	.client(() => API_ORIGIN)

const fetchApi = createIsomorphicFn()
	.server(fetchAsVisitor)
	.client(
		async (url: string, init: RequestInit) =>
			await fetch(url, { ...init, credentials: 'include' })
	)

/** Provided to `@soonlane/app` once; `createIsomorphicFn` looks up the SSR request per call, so visitors share no state. */
export const rpcLink = new RPCLink({
	url: RPC_PREFIX,
	origin: getApiOrigin,
	fetch: fetchApi,
})
