import type { DatePickerChoice } from '@soonlane/analytics'
import { DueDatePicker } from '@soonlane/app/tasks/components/composer/due-date-picker'
import { TaskActionsMenu } from '@soonlane/app/tasks/components/task/task-actions-menu'
import type { Task } from '@soonlane/contracts'
import type { CalendarDate, TaskPriority } from '@soonlane/domain'
import { MenuItem, MenuSeparator } from '@soonlane/ui/components/menu'
import { Popover, PopoverContent } from '@soonlane/ui/components/popover'
import { PencilLine } from 'lucide-react'
import { type RefObject, useRef } from 'react'
import { TaskMenuDateGroup } from './task-menu-date-group'
import { TaskMenuPriorityGroup } from './task-menu-priority-group'

interface TaskRowMenuProps {
	task: Task
	today: CalendarDate
	className?: string
	autoFocus?: boolean
	/** Whether the date picker is open under the "…" button; the row's "t" opens it too. */
	isPickingDate: boolean
	triggerRef: RefObject<HTMLButtonElement | null>
	onEdit: () => void
	onDateChange: (dueDate: CalendarDate, choice: DatePickerChoice) => void
	onPickingDateChange: (isPickingDate: boolean) => void
	onPriorityChange: (priority: TaskPriority) => void
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
	isPickingDate,
	triggerRef,
	onEdit,
	onDateChange,
	onPickingDateChange,
	onPriorityChange,
}: Readonly<TaskRowMenuProps>) {
	const inputRef = useRef<HTMLInputElement>(null)

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
					onDateChange={onDateChange}
					onMoreDates={() => onPickingDateChange(true)}
					today={today}
				/>

				<TaskMenuPriorityGroup
					onChange={onPriorityChange}
					value={task.priority}
				/>
			</TaskActionsMenu>

			<Popover onOpenChange={onPickingDateChange} open={isPickingDate}>
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
							onDateChange(dueDate, choice)
							onPickingDateChange(false)
						}}
						today={today}
					/>
				</PopoverContent>
			</Popover>
		</>
	)
}
