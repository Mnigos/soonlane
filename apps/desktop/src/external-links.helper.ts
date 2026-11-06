import { Utils } from 'electrobun'

/** Native navigation rules: block everything, then allow the web app's own origin (last match wins). */
export function getNavigationRules(appUrl: URL) {
	return ['^*', `${appUrl.origin}/*`]
}

function isWebLink(url: URL) {
	return (
		url.protocol === 'https:' ||
		url.protocol === 'http:' ||
		url.protocol === 'mailto:'
	)
}

/** Opens a link that leaves the web app in the system browser; returns whether it did. */
export function openOutsideApp(href: string, appUrl: URL) {
	const url = URL.parse(href)

	if (!url || url.origin === appUrl.origin || !isWebLink(url)) return false

	return Utils.openExternal(url.href)
}
