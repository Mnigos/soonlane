import { AUTH_BASE_PATH, EXPO_PROXY_PATH } from '@soonlane/auth'
import { openAuthSessionAsync } from 'expo-web-browser'

/** Where the sign-in sheet closes, on success and on error; only the sheet's own result carries the session back. */
export const SIGN_IN_RETURN_URL = 'soonlane://'

/**
 * Opens Google's `authorizationURL` in the iPhone's sign-in sheet, through the
 * API's Expo proxy, without Safari's cookies. Resolves with the return's
 * `cookie` and `error` code, or undefined when the user closed or cancelled it.
 */
export async function openSignInSheet(authorizationURL: string) {
	const proxy = new URL(
		`${AUTH_BASE_PATH}${EXPO_PROXY_PATH}`,
		process.env.EXPO_PUBLIC_API_URL
	)

	proxy.searchParams.set('authorizationURL', authorizationURL)

	const result = await openAuthSessionAsync(proxy.href, SIGN_IN_RETURN_URL, {
		preferEphemeralSession: true,
	})

	if (result.type !== 'success') return undefined

	const returned = new URL(result.url).searchParams

	return { cookie: returned.get('cookie'), error: returned.get('error') }
}
