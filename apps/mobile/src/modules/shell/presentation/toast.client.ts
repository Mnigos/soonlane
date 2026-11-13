import { AccessibilityInfo } from 'react-native'

interface ToastAction {
	label: string
	onClick: () => void
}

interface ToastOptions {
	id?: string
	action?: ToastAction
}

interface ShownToast extends ToastOptions {
	message: string
}

/** Sonner's default, so a toast stays as long as on the web. */
const TOAST_DURATION_MS = 4000
const listeners = new Set<() => void>()

let shownToast: ShownToast | undefined
let hideTimer: ReturnType<typeof setTimeout> | undefined

function setShownToast(toast: ShownToast | undefined) {
	clearTimeout(hideTimer)
	shownToast = toast
	if (toast) hideTimer = setTimeout(hideToast, TOAST_DURATION_MS)
	for (const listener of listeners) listener()
}

/** One toast at a time: a newer one replaces the shown one, whatever its id. */
export function showToast(message: string, options: ToastOptions = {}) {
	setShownToast({ message, ...options })
	AccessibilityInfo.announceForAccessibility(message)
}

/** Hides the shown toast only when it has this id, as sonner's `toast.dismiss(id)` does. */
export function dismissToast(id: string) {
	if (shownToast?.id === id) setShownToast(undefined)
}

export function hideToast() {
	setShownToast(undefined)
}

export function subscribeToToast(onChange: () => void) {
	listeners.add(onChange)

	return () => {
		listeners.delete(onChange)
	}
}

export function getShownToast() {
	return shownToast
}
