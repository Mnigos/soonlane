import { useSyncExternalStore } from 'react'
import { readStoredConsent } from '../consent-cookie.helper'
import type { ConsentState } from '../consent.types'

/** Cookies have no change event; a choice made in another tab shows once this tab is visible again. */
function subscribe(onChange: () => void) {
	document.addEventListener('visibilitychange', onChange)

	return () => document.removeEventListener('visibilitychange', onChange)
}

const getServerSnapshot = () => undefined

/**
 * The choice stored in the consent cookie, or `undefined` while the server renders and the client
 * hydrates. Prerendered pages are built without the visitor's cookie, so the stored choice is only
 * known in the browser.
 */
export function useStoredConsent(
	cookiePrefix: string
): ConsentState | undefined {
	return useSyncExternalStore(
		subscribe,
		() => readStoredConsent(cookiePrefix),
		getServerSnapshot
	)
}
