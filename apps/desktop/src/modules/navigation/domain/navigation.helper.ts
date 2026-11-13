import { DESKTOP_PAGE_ORIGIN } from '@soonlane/auth'

/** `webcal:` opens Calendar.app's subscribe sheet for a calendar link. */
const EXTERNAL_PROTOCOLS = new Set(['https:', 'http:', 'mailto:', 'webcal:'])

/** Native navigation rules (last match wins): the window stays on the bundled page and every other navigation is blocked. */
export const PAGE_NAVIGATION_RULES = ['^*', `${DESKTOP_PAGE_ORIGIN}/*`]

/**
 * A link the page cannot follow itself: web, mail and `webcal:` links go to the
 * system's handler, the web app and the public site included; anything else
 * (`file:`, `javascript:`, `data:`, custom schemes) opens nowhere.
 */
export function resolveExternalLink(href: string) {
	const url = URL.parse(href)

	return url && EXTERNAL_PROTOCOLS.has(url.protocol) ? url : undefined
}
