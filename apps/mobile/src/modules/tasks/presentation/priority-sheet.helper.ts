import { getHostPorts } from '@soonlane/app/host-ports'
import { TASK_PRIORITIES, type TaskPriority } from '@soonlane/domain'
import { showActionSheet } from '@/modules/shell/presentation/action-sheet.client'

/** The web's Priority menu as an action sheet; picking another priority is captured as on the web's chip. */
export function showPrioritySheet(
	current: TaskPriority,
	onChange: (priority: TaskPriority) => void
) {
	const options = [
		...TASK_PRIORITIES.map(level => `Priority ${level}`),
		'Cancel',
	]

	showActionSheet({ title: 'Priority', options }, index => {
		const picked = TASK_PRIORITIES[index]
		if (!picked) return

		if (picked !== current)
			getHostPorts().capture('priority_set', { priority: picked })
		onChange(picked)
	})
}
