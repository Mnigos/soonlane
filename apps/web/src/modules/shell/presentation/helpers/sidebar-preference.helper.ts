import type { SidebarPreference } from '../sidebar-preference.types'

export const SIDEBAR_COOKIE = 'soonlist-sidebar'
const COOKIE_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000
// Tailwind's xl breakpoint: from here the full sidebar fits beside the centered column without covering it.
const WIDE_VIEWPORT_QUERY = '(min-width: 80rem)'

export function toSidebarPreference(value?: string): SidebarPreference {
	return value === 'rail' ? 'rail' : 'full'
}

export function readSidebarPreference(cookieHeader: string) {
	const entry = cookieHeader
		.split(';')
		.map(part => part.trim())
		.find(part => part.startsWith(`${SIDEBAR_COOKIE}=`))

	return toSidebarPreference(entry?.slice(SIDEBAR_COOKIE.length + 1))
}

/** Remembers the choice for the next SSR render; browsers without the Cookie Store API keep the default. */
export async function saveSidebarPreference(preference: SidebarPreference) {
	if (!('cookieStore' in window)) return

	await window.cookieStore.set({
		name: SIDEBAR_COOKIE,
		value: preference,
		path: '/',
		expires: Date.now() + COOKIE_MAX_AGE_MS,
		sameSite: 'lax',
	})
}

/** Wide screens keep a docked sidebar; narrower ones show the full sidebar as a temporary overlay. */
export function isWideViewport() {
	return window.matchMedia(WIDE_VIEWPORT_QUERY).matches
}
