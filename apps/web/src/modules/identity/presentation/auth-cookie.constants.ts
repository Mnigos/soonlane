import { getSignedInHintCookie } from '@soonlane/auth'

/**
 * The API's cookie prefix in this build's environment (`VITE_AUTH_COOKIE_PREFIX`), which names the session,
 * the signed-in hint and the consent cookie. A build without it gets `soonlane-dev`, a name no deployed
 * environment uses, so it can never read another environment's cookies.
 */
export const AUTH_COOKIE_PREFIX =
	import.meta.env.VITE_AUTH_COOKIE_PREFIX || 'soonlane-dev'
export const SIGNED_IN_HINT_COOKIE = getSignedInHintCookie(AUTH_COOKIE_PREFIX)
