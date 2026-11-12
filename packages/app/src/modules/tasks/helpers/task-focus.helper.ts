/** A task row that can be selected: the row's `li`, not a row turned into the edit card or a completed task. */
const TASK_ROW = 'main li[data-task-id]'

/**
 * A ref callback for a task's row or "…" button (`data-task-id`): a save or a delete can take the row away
 * with the focused element, so focus follows the task to the same element wherever it moved, else the next
 * or previous row's on the page, else its section, else the page (a section goes too when its last task leaves it).
 */
export function keepFocusAfterMove(element: HTMLElement | null) {
	return () => {
		if (!element || document.activeElement !== element) return

		const sameKind = `${element.localName}[data-task-id]`
		const movedSelector = `${element.localName}[data-task-id="${element.dataset.taskId}"]`
		const rows = [...document.querySelectorAll(TASK_ROW)]
		const index = rows.findIndex(row => row.contains(element))
		const editCard = element.closest('li')
		// The edit card is not a selectable row, so its own list holds the neighbours.
		const neighbours =
			index === -1
				? [editCard?.nextElementSibling, editCard?.previousElementSibling]
				: [rows[index + 1], rows[index - 1]]
		const section = element.closest('section')
		const main = element.closest('main')

		// After the commit, so the task's row has mounted wherever it moved to.
		queueMicrotask(() => {
			if (document.activeElement !== document.body) return

			const target = [
				document.querySelector(movedSelector),
				...neighbours.map(neighbour =>
					neighbour?.matches(sameKind)
						? neighbour
						: neighbour?.querySelector(sameKind)
				),
				section?.querySelector('input, button'),
				main?.querySelector(sameKind),
				main?.querySelector('input, button'),
			].find(
				(candidate): candidate is HTMLElement =>
					candidate instanceof HTMLElement && candidate.isConnected
			)

			target?.focus()
		})
	}
}

/** The selected task row: the one holding focus, also while focus sits on one of its buttons. */
export function getFocusedTaskRow() {
	return document.activeElement?.closest<HTMLElement>(TASK_ROW) ?? undefined
}

/** Selects the next (1) or previous (-1) task row on the page, from the first or last one when none is selected. */
export function focusTaskRow(step: 1 | -1) {
	const rows = [...document.querySelectorAll<HTMLElement>(TASK_ROW)]
	const selected = getFocusedTaskRow()
	const start = step === 1 ? -1 : rows.length
	const row = rows[(selected ? rows.indexOf(selected) : start) + step]

	row?.focus({ preventScroll: true })
	row?.scrollIntoView({ block: 'nearest' })
}
