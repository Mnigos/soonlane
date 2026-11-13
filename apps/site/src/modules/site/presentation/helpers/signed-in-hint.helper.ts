import { SIGNED_IN_HINT_COOKIE } from '../site-environment.constants'

/**
 * Head script that mirrors the hint cookie onto `<html data-signed-in>` before
 * first paint, so the prerendered site picks its variant with `signed-in:`
 * instead of swapping after hydration. Cookies have no change event; another
 * tab's sign-in or sign-out shows once this tab is visible again.
 */
export const SIGNED_IN_HINT_SCRIPT = `(() => {
	const sync = () => document.documentElement.toggleAttribute('data-signed-in', document.cookie.split('; ').includes('${SIGNED_IN_HINT_COOKIE}=1'))
	sync()
	document.addEventListener('visibilitychange', sync)
})()`
