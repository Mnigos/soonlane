import { RPCLink } from '@orpc/client/fetch'
import { desktopHost } from './desktop-host.client'

/**
 * The API link `@soonlane/app` calls through: the desktop token as a bearer,
 * never cookies, which the API refuses from this page.
 */
export const apiLink = new RPCLink({
	url: '/api/rpc',
	origin: import.meta.env.API_URL,
	headers: async () => {
		const token = await desktopHost.readToken()

		return token ? { authorization: `Bearer ${token}` } : {}
	},
	fetch: async (url, init) =>
		await fetch(url, { ...init, credentials: 'omit' }),
})
