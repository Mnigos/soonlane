import { createIsomorphicFn } from '@tanstack/react-start'
import { SIGNED_IN_HINT_COOKIE } from '@/modules/identity/presentation/auth-cookie.constants'

const SIGNED_IN_ATTRIBUTE = 'data-signed-in'
const SIGNED_IN_COOKIE_PAIR = `${SIGNED_IN_HINT_COOKIE}=1`

/**
 * Head script that mirrors the hint cookie onto `<html data-signed-in>` before
 * first paint, so the prerendered site picks its variant with `signed-in:`
 * instead of swapping after hydration. Cookies have no change event; another
 * tab's sign-in or sign-out shows once this tab is visible again.
 */
export const SIGNED_IN_HINT_SCRIPT = `(() => {
	const sync = () => document.documentElement.toggleAttribute('${SIGNED_IN_ATTRIBUTE}', document.cookie.split('; ').includes('${SIGNED_IN_COOKIE_PAIR}'))
	sync()
	document.addEventListener('visibilitychange', sync)
})()`

/** Re-reads the hint when a client-side navigation enters the site, such as after signing out in this tab. */
export const syncSignedInHint = createIsomorphicFn().client(() => {
	document.documentElement.toggleAttribute(
		SIGNED_IN_ATTRIBUTE,
		document.cookie.split('; ').includes(SIGNED_IN_COOKIE_PAIR)
	)
})
