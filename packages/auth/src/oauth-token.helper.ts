import { isAPIError } from 'better-auth/api'
import type { Auth } from './better-auth.config'

/** Refreshes a linked account's tokens through its provider and stores the new pair encrypted; rejects with an error whose message is Better Auth's code, never the provider's answer. */
export async function refreshStoredOAuthToken(
	auth: Auth,
	userId: string,
	accountId: string
) {
	try {
		const { accessToken } = await auth.api.refreshToken({
			body: { accountId, userId },
		})

		if (accessToken) return accessToken
	} catch (error) {
		throw new Error(
			isAPIError(error) ? String(error.body?.code) : 'REFRESH_FAILED',
			{ cause: error }
		)
	}

	throw new Error('NO_ACCESS_TOKEN')
}
