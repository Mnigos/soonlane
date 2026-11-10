import { useSyncExternalStore } from 'react'
import type { ConsentState } from '../../domain/consent.types'
import { getConsent } from '../helpers/consent-cookie.helper'

// Cookies have no change event; a choice made in another tab shows once this tab is visible again.
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
export function useStoredConsent(): ConsentState | undefined {
	return useSyncExternalStore(subscribe, getConsent, getServerSnapshot)
}
