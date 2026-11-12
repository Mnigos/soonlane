/** Fields that take typing, and the open menus, popovers, lists and dialogs (or a trigger whose popup is open) that handle their own keys; a trigger whose tooltip shows does not count. */
const KEY_OWNERS =
	'input, textarea, select, [contenteditable], [role="combobox"], [role="textbox"], [role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], [aria-haspopup][aria-expanded="true"]'

/**
 * Whether a keydown may run a single-key shortcut. Cmd, Ctrl and Alt combinations stay with the browser
 * and the composer; Shift counts only for a character that needs it, such as "?".
 */
export function isShortcutKeydown(event: KeyboardEvent) {
	const isShiftedLetterOrKey =
		event.shiftKey &&
		(event.key.length > 1 ||
			event.key.toLowerCase() !== event.key.toUpperCase())

	return !(
		event.defaultPrevented ||
		event.isComposing ||
		event.metaKey ||
		event.ctrlKey ||
		event.altKey ||
		isShiftedLetterOrKey ||
		(event.target instanceof Element && event.target.closest(KEY_OWNERS))
	)
}
