import type { LinkTarget } from './navigation.types'

const BROWSER_PROTOCOLS = new Set(['https:', 'http:', 'mailto:'])

/** Native navigation rules: block everything, then allow the web app's own origin (last match wins). */
export function getNavigationRules(appUrl: URL) {
	return ['^*', `${appUrl.origin}/*`]
}

/**
 * Where a link opens: the web app's own pages stay in the window, other web
 * and mail links go to the system browser, and anything else (`file:`,
 * `javascript:`, `data:`, custom schemes) opens nowhere. Only the exact origin
 * counts as the app, so `http:` versions and subdomains of it leave the app.
 */
export function resolveLink(href: string, appUrl: URL): LinkTarget | undefined {
	const url = URL.parse(href)

	if (!url) return undefined
	if (url.origin === appUrl.origin) return { opensIn: 'window', url }

	return BROWSER_PROTOCOLS.has(url.protocol)
		? { opensIn: 'browser', url }
		: undefined
}
