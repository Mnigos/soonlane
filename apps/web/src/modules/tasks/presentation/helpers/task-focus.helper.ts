/**
 * A ref callback for a task's controls (`data-task-id`): a save or a delete can take the row away with its
 * focused control, so focus follows the task to wherever it moved, else a neighbouring row, else its section,
 * else the page (a section goes too when its last task leaves it).
 */
export function keepFocusAfterMove(button: HTMLButtonElement) {
	return () => {
		if (document.activeElement !== button) return

		const movedSelector = `[data-task-id="${button.dataset.taskId}"]`
		const row = button.closest('li')
		const neighbours = [row?.nextElementSibling, row?.previousElementSibling]
		const section = button.closest('section')
		const main = button.closest('main')

		// After the commit, so the task's row has mounted wherever it moved to.
		queueMicrotask(() => {
			if (document.activeElement !== document.body) return

			const target = [
				document.querySelector<HTMLElement>(movedSelector),
				...neighbours.map(neighbour =>
					neighbour?.querySelector<HTMLElement>('[data-task-id]')
				),
				section?.querySelector<HTMLElement>('input, button'),
				main?.querySelector<HTMLElement>('[data-task-id]'),
				main?.querySelector<HTMLElement>('input, button'),
			].find(element => element?.isConnected)

			target?.focus()
		})
	}
}
