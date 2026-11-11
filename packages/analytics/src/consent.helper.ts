import type { ConsentChoice, ConsentState } from './consent.types'
import { readCookie } from './utils/cookie.util'

/** Shared by every host under `CONSENT_COOKIE_DOMAINS`, so one answer covers the site and the app. */
export const CONSENT_COOKIE = 'soonlane-privacy'
/** Staging first: its hosts also end in `.soonlane.com`. */
const CONSENT_COOKIE_DOMAINS = ['staging.soonlane.com', 'soonlane.com']
/** Raising it asks everyone again, e.g. when a new optional category appears. */
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

/** The stored answer wins; without one, Global Privacy Control gives `gpc`, which counts as denied. */
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

/**
 * The domain the answer is stored for on this host: `staging.soonlane.com` on staging hosts,
 * `soonlane.com` on production hosts, and none elsewhere (Vercel previews, localhost), where the
 * cookie stays host-only because the browser rejects a domain the host is not under.
 */
export function getConsentCookieDomain(hostname: string) {
	return CONSENT_COOKIE_DOMAINS.find(
		domain => hostname === domain || hostname.endsWith(`.${domain}`)
	)
}

export function toConsentCookie(choice: ConsentChoice) {
	return {
		value: `${choice}.${CONSENT_VERSION}`,
		maxAgeMs: CONSENT_MAX_AGE_MS[choice],
	}
}
