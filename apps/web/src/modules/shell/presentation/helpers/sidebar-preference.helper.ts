import { readCookie, saveCookie } from '@soonlane/analytics/cookie'
import type { SidebarPreference } from '../sidebar-preference.types'

const SIDEBAR_COOKIE = 'soonlane-sidebar'
/** Set before the rename to Soonlane; read until the owner saves the preference again. */
const LEGACY_SIDEBAR_COOKIE = 'soonlist-sidebar'
const COOKIE_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000
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
	await saveCookie(SIDEBAR_COOKIE, preference, COOKIE_MAX_AGE_MS)
}

/** Wide screens keep a docked sidebar; narrower ones show the full sidebar as a temporary overlay. */
export function isWideViewport() {
	return window.matchMedia(WIDE_VIEWPORT_QUERY).matches
}
