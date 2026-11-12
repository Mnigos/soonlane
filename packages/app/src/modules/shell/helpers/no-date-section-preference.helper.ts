import { saveCookie } from '@soonlane/analytics/cookie'
import { readCookie } from '@soonlane/domain'
import { PREFERENCE_COOKIE_MAX_AGE_MS } from './preference-cookie.constants'

const NO_DATE_SECTION_COOKIE = 'soonlane-no-date-section'

/** Open unless the owner collapsed it on this device. */
export function readNoDateSectionOpen(cookieHeader: string) {
	return readCookie(cookieHeader, NO_DATE_SECTION_COOKIE) !== 'collapsed'
}

/** Remembers the choice for the next SSR render. */
export async function saveNoDateSectionOpen(isOpen: boolean) {
	await saveCookie(
		NO_DATE_SECTION_COOKIE,
		isOpen ? 'open' : 'collapsed',
		PREFERENCE_COOKIE_MAX_AGE_MS
	)
}
