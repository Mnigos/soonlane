/**
 * Runs before the web app's scripts on every page load. It marks the document
 * so the web app can make room for the inset traffic lights (the `desktop:`
 * Tailwind variant); nothing else crosses from the shell into the page.
 */
export const SHELL_PRELOAD = `(() => {
	const mark = root => root.setAttribute('data-shell', 'desktop')
	if (document.documentElement) return mark(document.documentElement)
	new MutationObserver((_, observer) => {
		if (!document.documentElement) return
		mark(document.documentElement)
		observer.disconnect()
	}).observe(document, { childList: true })
})()`
