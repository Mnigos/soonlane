import { readCookie } from '@/utils/cookie.util'
import type { ConsentChoice, ConsentState } from './consent.types'

export const CONSENT_COOKIE = 'soonlane-consent'
// Raising it asks everyone again, e.g. when a new optional category appears.
const CONSENT_VERSION = 1
const DAY_MS = 24 * 60 * 60 * 1000
const CONSENT_MAX_AGE_MS = {
	granted: 365 * DAY_MS,
	denied: 182 * DAY_MS,
} satisfies Record<ConsentChoice, number>

function toConsentChoice(value?: string): ConsentChoice | undefined {
	const [choice, version] = value?.split('.') ?? []

	if (version !== String(CONSENT_VERSION)) return undefined

	return choice === 'granted' || choice === 'denied' ? choice : undefined
}

/** The stored answer wins; without one, Global Privacy Control counts as denied. */
export function readConsent(
	cookieHeader: string,
	hasGpc: boolean
): ConsentState {
	const choice = toConsentChoice(readCookie(cookieHeader, CONSENT_COOKIE))

	if (choice) return choice

	return hasGpc ? 'gpc' : 'unanswered'
}

export function hasAnalyticsConsent(headers: Headers) {
	return readConsent(headers.get('cookie') ?? '', false) === 'granted'
}

export function toConsentCookie(choice: ConsentChoice) {
	return {
		value: `${choice}.${CONSENT_VERSION}`,
		maxAgeMs: CONSENT_MAX_AGE_MS[choice],
	}
}
