import { DESKTOP_SIGN_IN_PATH } from '@soonlane/auth'
import type { LinkTarget } from './navigation.types'

const BROWSER_PROTOCOLS = new Set(['https:', 'http:', 'mailto:'])

// Last match wins. The sign-in page is blocked because Google refuses embedded webviews.
export function getNavigationRules(appUrl: URL) {
	return [
		'^*',
		`${appUrl.origin}/*`,
		`^${appUrl.origin}${DESKTOP_SIGN_IN_PATH}*`,
	]
}

// Only the exact origin is the app: its `http:` version and subdomains open in the browser.
export function resolveLink(href: string, appUrl: URL): LinkTarget | undefined {
	const url = URL.parse(href)

	if (!url) return undefined
	if (url.origin === appUrl.origin) return { opensIn: 'window', url }

	return BROWSER_PROTOCOLS.has(url.protocol)
		? { opensIn: 'browser', url }
		: undefined
}
