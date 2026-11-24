import type { MenuAnchor } from '@soonlane/ui/components/menu'
import { type MouseEvent, useState } from 'react'

export interface TaskMenuState {
	isOpen: boolean
	/** The pointer's point after a right-click; `undefined` opens the menu under the "…" button. */
	anchor: MenuAnchor
	onOpenChange: (isOpen: boolean) => void
}

/** Right-clicks on these keep the browser's own menu, for opening a link in a new tab or pasting. */
const NATIVE_MENU_SELECTOR = 'a, input, textarea, [contenteditable="true"]'

/** The task row's "…" menu, opened from its button or, on a right-click anywhere on the row, at the pointer. */
export function useTaskMenu() {
	const [isOpen, setIsOpen] = useState(false)
	const [anchor, setAnchor] = useState<MenuAnchor>()

	function onOpenChange(nextIsOpen: boolean) {
		if (nextIsOpen) setAnchor(undefined)
		setIsOpen(nextIsOpen)
	}

	function openAtPointer(event: MouseEvent<HTMLElement>) {
		if (
			event.target instanceof Element &&
			event.target.closest(NATIVE_MENU_SELECTOR)
		)
			return

		event.preventDefault()
		const { clientX: x, clientY: y } = event
		setAnchor({
			getBoundingClientRect: () =>
				DOMRect.fromRect({ x, y, width: 0, height: 0 }),
		})
		setIsOpen(true)
	}

	return {
		menu: { isOpen, anchor, onOpenChange } satisfies TaskMenuState,
		openAtPointer,
	}
}
