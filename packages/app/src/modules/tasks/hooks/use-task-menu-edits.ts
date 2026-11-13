import type { DatePickerChoice } from '@soonlane/analytics'
import type { Task } from '@soonlane/contracts'
import type { CalendarDate, TaskPriority } from '@soonlane/domain'
import { getHostPorts } from '../../../host-ports.client'
import { getMenuEdit } from '../helpers/task-edit.helper'
import { useUpdateTask } from './use-update-task'

/** The date and priority changes of a task's "…" menu: each saves at once and does nothing when it matches the task. */
export function useTaskMenuEdits(task: Task, today: CalendarDate) {
	const { capture } = getHostPorts()
	const { updateTask } = useUpdateTask(today)

	/** `undefined` removes the date with its time and repeat rule. */
	function changeDate(
		dueDate: CalendarDate | undefined,
		choice: DatePickerChoice
	) {
		capture('date_picker_used', {
			choice,
			hasTime: task.dueTime !== undefined,
		})
		const edit = getMenuEdit(task, today, { dueDate })

		if (edit) updateTask(edit)
	}

	function changePriority(priority: TaskPriority) {
		const edit = getMenuEdit(task, today, { priority })

		if (!edit) return

		capture('priority_set', { priority })
		updateTask(edit)
	}

	return { changeDate, changePriority }
}
