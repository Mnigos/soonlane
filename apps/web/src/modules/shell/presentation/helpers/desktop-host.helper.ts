type DesktopHostMessage =
	| { type: 'quick-add-done' }
	| { type: 'dock-badge'; count: number }

declare global {
	interface Window {
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

export function sendToDesktopHost(message: DesktopHostMessage) {
	if (!isDesktopShell()) return false

	window.__electrobunSendToHost?.(message)

	return true
}
