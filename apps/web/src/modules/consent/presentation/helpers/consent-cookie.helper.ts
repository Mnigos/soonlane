import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'
import { saveCookie } from '@/utils/cookie.util'
import {
	CONSENT_COOKIE,
	readConsent,
	toConsentCookie,
} from '../../domain/consent.helper'
import type { ConsentChoice } from '../../domain/consent.types'

// SSR reads the request, so the banner is in the first HTML or absent; the browser reads its own cookie and signal.
export const getConsent = createIsomorphicFn()
	.server(() =>
		readConsent(
			getRequestHeader('cookie') ?? '',
			getRequestHeader('sec-gpc') === '1'
		)
	)
	.client(() =>
		readConsent(
			document.cookie,
			'globalPrivacyControl' in navigator &&
				navigator.globalPrivacyControl === true
		)
	)

export async function saveConsent(choice: ConsentChoice) {
	const { value, maxAgeMs } = toConsentCookie(choice)

	await saveCookie(CONSENT_COOKIE, value, maxAgeMs)
}
