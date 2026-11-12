import { saveCookie } from '@soonlane/analytics/cookie'
import { readCookie } from '@soonlane/domain'
import type { SidebarPreference } from '../sidebar-preference.types'
import { PREFERENCE_COOKIE_MAX_AGE_MS } from './preference-cookie.constants'

const SIDEBAR_COOKIE = 'soonlane-sidebar'
/** Set before the rename to Soonlane; read until the owner saves the preference again. */
const LEGACY_SIDEBAR_COOKIE = 'soonlist-sidebar'
/** Tailwind's xl breakpoint. */
const WIDE_VIEWPORT_QUERY = '(min-width: 80rem)'

function toSidebarPreference(value?: string): SidebarPreference {
	return value === 'rail' ? 'rail' : 'full'
}

export function readSidebarPreference(cookieHeader: string) {
	return toSidebarPreference(
		readCookie(cookieHeader, SIDEBAR_COOKIE) ??
			readCookie(cookieHeader, LEGACY_SIDEBAR_COOKIE)
	)
}

/** Remembers the choice for the next SSR render. */
export async function saveSidebarPreference(preference: SidebarPreference) {
	await saveCookie(SIDEBAR_COOKIE, preference, PREFERENCE_COOKIE_MAX_AGE_MS)
}

/** Wide screens keep a docked sidebar; narrower ones show the full sidebar as a temporary overlay. */
export function isWideViewport() {
	return window.matchMedia(WIDE_VIEWPORT_QUERY).matches
}
