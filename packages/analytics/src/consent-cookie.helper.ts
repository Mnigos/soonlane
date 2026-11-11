import {
	CONSENT_COOKIE,
	getConsentCookieDomain,
	LEGACY_CONSENT_COOKIE,
	readConsent,
	toConsentCookie,
} from './consent.helper'
import type { ConsentChoice, ConsentState } from './consent.types'
import { saveCookie } from './utils/cookie.util'

/** The answer stored in this browser; browser only. */
export function readStoredConsent(): ConsentState {
	return readConsent(
		document.cookie,
		'globalPrivacyControl' in navigator &&
			navigator.globalPrivacyControl === true
	)
}

/** Stores the answer for every host of this environment and drops the host-only cookie it replaces. */
export async function saveConsent(choice: ConsentChoice) {
	const { value, maxAgeMs } = toConsentCookie(choice)

	await saveCookie(LEGACY_CONSENT_COOKIE, '', 0)
	await saveCookie(
		CONSENT_COOKIE,
		value,
		maxAgeMs,
		getConsentCookieDomain(location.hostname)
	)
}
