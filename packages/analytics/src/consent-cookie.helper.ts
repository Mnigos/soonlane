import {
	getConsentCookie,
	getConsentCookieDomain,
	readConsent,
	toConsentCookie,
} from './consent.helper'
import type { ConsentChoice, ConsentState } from './consent.types'
import { saveCookie } from './utils/cookie.util'

/** The answer stored in this browser; browser only. */
export function readStoredConsent(cookiePrefix: string): ConsentState {
	return readConsent(
		document.cookie,
		cookiePrefix,
		'globalPrivacyControl' in navigator &&
			navigator.globalPrivacyControl === true
	)
}

/** Stores the answer for every host of this environment. */
export async function saveConsent(cookiePrefix: string, choice: ConsentChoice) {
	const { value, maxAgeMs } = toConsentCookie(choice)

	await saveCookie(
		getConsentCookie(cookiePrefix),
		value,
		maxAgeMs,
		getConsentCookieDomain(location.hostname)
	)
}
