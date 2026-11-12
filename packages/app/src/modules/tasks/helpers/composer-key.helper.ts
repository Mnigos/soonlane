import type { KeyboardEvent } from 'react'

/** Cmd+Enter or Ctrl+Enter: saves the task from anywhere in the composer, even over an open "@" suggestion list. */
export function isSaveShortcut(
	event: Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey'>
) {
	return event.key === 'Enter' && (event.metaKey || event.ctrlKey)
}
