import { type ClientLink, createORPCClient, DynamicLink } from '@orpc/client'
import type { RouterContractClient } from '@orpc/contract'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import type { Contract } from '@soonlane/contracts'

let hostLink: ClientLink<Record<never, never>> | undefined

/**
 * The host app hands over its link once at startup, before anything renders.
 * Per-visitor state (the web app's SSR request headers) stays inside the link.
 */
export function provideRpcLink(link: ClientLink<Record<never, never>>) {
	hostLink = link
}

const rpc: RouterContractClient<Contract> = createORPCClient(
	new DynamicLink(() => {
		if (!hostLink)
			throw new Error('Call provideRpcLink before the first API call.')

		return hostLink
	})
)

export const orpcQuery = createTanstackQueryUtils(rpc)
