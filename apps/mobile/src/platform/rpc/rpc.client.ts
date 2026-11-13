import { RPCLink } from '@orpc/client/fetch'

/** Provided to `@soonlane/app` once, by the root layout. */
export const rpcLink = new RPCLink({
	url: '/api/rpc',
	origin: process.env.EXPO_PUBLIC_API_URL,
})
