import { orpcQuery } from '@soonlane/app/rpc-query'
import type { QueryClient } from '@tanstack/react-query'
import { desktopHost } from '../../../platform/rpc/desktop-host.client'

/** The signed-in user, or `null` without a token. A token the API no longer knows (expired, revoked) is forgotten. */
export async function loadSessionUser(queryClient: QueryClient) {
	if (!(await desktopHost.readToken())) return null

	const { user } = await queryClient.query(orpcQuery.identity.me.queryOptions())

	if (!user) await desktopHost.signOut()

	return user
}
