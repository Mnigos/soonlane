// Nothing but this marker crosses from the shell into the page.
export const SHELL_PRELOAD = `(() => {
	const mark = root => root.setAttribute('data-shell', 'desktop')
	if (document.documentElement) return mark(document.documentElement)
	new MutationObserver((_, observer) => {
		if (!document.documentElement) return
		mark(document.documentElement)
		observer.disconnect()
	}).observe(document, { childList: true })
})()`
