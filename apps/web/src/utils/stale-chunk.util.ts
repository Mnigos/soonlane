/** Chrome, Firefox and Safari messages for a module that failed to load, and Vite's for a failed CSS preload. */
const CHUNK_ERROR_PREFIXES = [
	'Failed to fetch dynamically imported module',
	'error loading dynamically imported module',
	'Importing a module script failed',
	'Unable to preload',
]
const RELOAD_KEY = 'soonlane-chunk-reload'
const RELOAD_WINDOW_MS = 60_000

type ReloadStorage = Pick<Storage, 'getItem' | 'setItem'>

/** A lazy chunk or its CSS failed to load, usually because a deploy replaced the chunk names this page knows. */
export function isChunkLoadError(error: unknown) {
	return (
		error instanceof Error &&
		CHUNK_ERROR_PREFIXES.some(prefix => error.message.startsWith(prefix))
	)
}

/**
 * Allows one automatic reload per window and records it, so a chunk that
 * still fails after the reload shows the error screen instead of reloading
 * forever. Without storage it allows none.
 */
export function claimReload(getStorage: () => ReloadStorage, now: number) {
	try {
		const storage = getStorage()
		const elapsed = now - Number(storage.getItem(RELOAD_KEY))

		if (elapsed >= 0 && elapsed < RELOAD_WINDOW_MS) return false
		storage.setItem(RELOAD_KEY, String(now))

		return true
	} catch {
		return false
	}
}

/**
 * Fetches the failed chunk past the HTTP cache, which overwrites a 404 the
 * browser stored for it. Chrome and Firefox name the URL in the error; Safari
 * does not, so there the reload alone has to do.
 */
async function refreshChunk(error: unknown) {
	const url =
		error instanceof Error
			? error.message
					.split(' ')
					.find(word => word.startsWith(`${location.origin}/`))
			: undefined

	if (!url) return

	try {
		await fetch(url, { cache: 'reload' })
	} catch {
		// Offline: nothing to refresh, and a reload would fail the same way.
	}
}

/** Loads the page again with fresh HTML after refreshing the failed chunk. */
export async function reloadAfterChunkError(error: unknown) {
	await refreshChunk(error)
	location.reload()
}

/**
 * Reloads the page once when a chunk error broke it, so a tab left open across
 * a deploy picks up the new chunk names. Only errors that reach the router
 * land here; an import its caller catches never reloads the page.
 */
export async function recoverFromChunkError(error: unknown) {
	if (!isChunkLoadError(error)) return

	await refreshChunk(error)
	if (navigator.onLine && claimReload(() => sessionStorage, Date.now()))
		location.reload()
}

function handlePreloadError({ payload }: VitePreloadErrorEvent) {
	if (isChunkLoadError(payload)) void refreshChunk(payload)
}

/**
 * Refreshes a failed chunk as soon as Vite reports it ('vite:preloadError'
 * fires for every failed dynamic import and CSS preload), before TanStack
 * Router's own reload on a missing module can run. The listener is one
 * function, so calling this again adds nothing.
 */
export function listenForChunkErrors() {
	if (typeof window === 'undefined') return

	window.addEventListener('vite:preloadError', handlePreloadError)
}
