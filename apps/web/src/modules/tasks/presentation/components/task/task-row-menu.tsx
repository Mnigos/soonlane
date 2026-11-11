import type { Task } from '@soonlane/contracts'
import type { CalendarDate, TaskPriority } from '@soonlane/domain'
import { MenuItem, MenuSeparator } from '@soonlane/ui/components/menu'
import { Popover, PopoverContent } from '@soonlane/ui/components/popover'
import { PencilLine } from 'lucide-react'
import { useRef, useState } from 'react'
import type { DatePickerChoice } from '@/modules/analytics/domain/analytics-event.types'
import { capture } from '@/modules/analytics/presentation/analytics.client'
import { getMenuEdit } from '../../helpers/task-edit.helper'
import { useUpdateTask } from '../../hooks/use-update-task'
import { DueDatePicker } from '../composer/due-date-picker'
import { TaskActionsMenu } from './task-actions-menu'
import { TaskMenuDateGroup } from './task-menu-date-group'
import { TaskMenuPriorityGroup } from './task-menu-priority-group'

interface TaskRowMenuProps {
	task: Task
	today: CalendarDate
	className?: string
	autoFocus?: boolean
	onEdit: () => void
}

/**
 * A task row's "…" menu: Edit, Date and Priority above Delete. A date or priority saves at once
 * like the same change in the edit card; "More dates" opens the date picker under the "…" button.
 */
export function TaskRowMenu({
	task,
	today,
	className,
	autoFocus,
	onEdit,
}: Readonly<TaskRowMenuProps>) {
	const { updateTask } = useUpdateTask(today)
	const [isPickingDate, setIsPickingDate] = useState(false)
	const triggerRef = useRef<HTMLButtonElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	/** Focus moves to the "…" before the save, so it follows the task when the new date moves its row to another list. */
	function changeDate(dueDate: CalendarDate, choice: DatePickerChoice) {
		triggerRef.current?.focus()
		capture('date_picker_used', {
			choice,
			has_time: task.dueTime !== undefined,
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

	return (
		<>
			<TaskActionsMenu
				autoFocus={autoFocus}
				className={className}
				task={task}
				today={today}
				triggerRef={triggerRef}
			>
				<MenuItem onClick={onEdit}>
					<PencilLine aria-hidden className="size-4" />
					Edit
				</MenuItem>

				<MenuSeparator />

				<TaskMenuDateGroup
					onDateChange={changeDate}
					onMoreDates={() => setIsPickingDate(true)}
					today={today}
				/>

				<TaskMenuPriorityGroup
					onChange={changePriority}
					value={task.priority}
				/>
			</TaskActionsMenu>

			<Popover onOpenChange={setIsPickingDate} open={isPickingDate}>
				<PopoverContent
					align="end"
					anchor={triggerRef}
					aria-label="Due date"
					className="flex w-62 flex-col"
					finalFocus={triggerRef}
					initialFocus={inputRef}
				>
					<DueDatePicker
						dueDate={task.dueDate}
						inputRef={inputRef}
						onDateChange={(dueDate, choice) => {
							changeDate(dueDate, choice)
							setIsPickingDate(false)
						}}
						today={today}
					/>
				</PopoverContent>
			</Popover>
		</>
	)
}
