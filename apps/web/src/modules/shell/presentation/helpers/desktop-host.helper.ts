/** What the page tells the desktop app's main process, which decodes and checks each message. */
type DesktopHostMessage =
	| { type: 'quick-add-done' }
	| { type: 'dock-badge'; count: number }

declare global {
	interface Window {
		/** Defined by the Electrobun preload on every page the desktop app loads. */
		__electrobunSendToHost?: (message: DesktopHostMessage) => void
	}
}

export function isDesktopShell() {
	return (
		typeof document !== 'undefined' &&
		document.documentElement.dataset.shell === 'desktop' &&
		typeof window.__electrobunSendToHost === 'function'
	)
}

/** Whether the message reached the desktop app; outside it nothing is sent. */
export function sendToDesktopHost(message: DesktopHostMessage) {
	if (!isDesktopShell()) return false

	window.__electrobunSendToHost?.(message)

	return true
}
