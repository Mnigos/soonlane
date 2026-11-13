import { getHostPorts } from '../../../host-ports.client'

/** What the page tells the desktop app's main process, which decodes and checks each message. */
export type DesktopHostMessage =
	| { type: 'quick-add-done' }
	| { type: 'quick-add-suggestions'; isOpen: boolean }
	| { type: 'dock-badge'; count: number }

/** Whether this page runs in the desktop app, whose host hands over `sendToDesktop`. */
export function isDesktopShell() {
	return getHostPorts().sendToDesktop !== undefined
}

/** Whether the message reached the desktop app; outside it nothing is sent. */
export function sendToDesktopHost(message: DesktopHostMessage) {
	const { sendToDesktop } = getHostPorts()

	sendToDesktop?.(message)

	return sendToDesktop !== undefined
}
