/** What the page tells the desktop app's main process, which decodes and checks each message. */
type DesktopHostMessage =
	| { type: 'quick-add-done' }
	| { type: 'quick-add-suggestions'; isOpen: boolean }
	| { type: 'dock-badge'; count: number }

/**
 * The Electrobun preload's `__electrobunSendToHost`, read without declaring it
 * on `Window`: the desktop app also loads Electrobun's own declaration of it.
 */
function getHostSender() {
	const send: unknown =
		typeof window === 'undefined'
			? undefined
			: Reflect.get(window, '__electrobunSendToHost')

	return typeof send === 'function' ? send : undefined
}

export function isDesktopShell() {
	return (
		typeof document !== 'undefined' &&
		document.documentElement.dataset.shell === 'desktop' &&
		getHostSender() !== undefined
	)
}

/** Whether the message reached the desktop app; outside it nothing is sent. */
export function sendToDesktopHost(message: DesktopHostMessage) {
	const send = getHostSender()

	if (!(send && isDesktopShell())) return false

	Reflect.apply(send, window, [message])

	return true
}
