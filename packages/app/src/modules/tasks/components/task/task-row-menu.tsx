import type { DatePickerChoice } from '@soonlane/analytics'
import type { Task } from '@soonlane/contracts'
import type { CalendarDate, TaskPriority } from '@soonlane/domain'
import { MenuItem, MenuSeparator } from '@soonlane/ui/components/menu'
import { Popover, PopoverContent } from '@soonlane/ui/components/popover'
import { Tooltip } from '@soonlane/ui/components/tooltip'
import { ListTree, PencilLine } from 'lucide-react'
import { type RefObject, useRef } from 'react'
import {
	getAddSubtaskState,
	SUBTASK_LIMIT_HINT,
} from '../../helpers/subtask.helper'
import { getNoDateHint } from '../../helpers/task-edit.helper'
import { DueDatePicker } from '../composer/due-date-picker'
import { TaskActionsMenu } from './task-actions-menu'
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
	/** Expands the task and opens the composer at the end of its subtasks. */
	onAddSubtask: () => void
	/** `undefined` removes the date with its time and repeat rule. */
	onDateChange: (
		dueDate: CalendarDate | undefined,
		choice: DatePickerChoice
	) => void
	onPickingDateChange: (isPickingDate: boolean) => void
	onPriorityChange: (priority: TaskPriority) => void
}

/**
 * A task row's "…" menu: Edit and Add subtask (left out at the deepest level), Date and Priority above Delete. A date, No date
 * or priority saves at once like the same change in the edit card; "More dates" opens the date picker under the "…" button.
 */
export function TaskRowMenu({
	task,
	today,
	className,
	autoFocus,
	isPickingDate,
	triggerRef,
	onEdit,
	onAddSubtask,
	onDateChange,
	onPickingDateChange,
	onPriorityChange,
}: Readonly<TaskRowMenuProps>) {
	const inputRef = useRef<HTMLInputElement>(null)
	const noDateHint = getNoDateHint(task.dueTime, task.repeat !== undefined)
	const addSubtaskState = getAddSubtaskState(task)
	const addSubtaskItem = (
		<MenuItem
			className="data-disabled:pointer-events-auto data-disabled:cursor-default"
			disabled={addSubtaskState === 'full'}
			onClick={onAddSubtask}
		>
			<ListTree aria-hidden className="size-4" />
			Add subtask
		</MenuItem>
	)
	const removeDate = task.dueDate
		? () => onDateChange(undefined, 'no_date')
		: undefined

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

				{addSubtaskState === 'available' && addSubtaskItem}

				{addSubtaskState === 'full' && (
					<Tooltip label={SUBTASK_LIMIT_HINT} side="left">
						{addSubtaskItem}
					</Tooltip>
				)}

				<MenuSeparator />

				<TaskMenuDateGroup
					noDateHint={noDateHint}
					onDateChange={onDateChange}
					onMoreDates={() => onPickingDateChange(true)}
					onNoDate={removeDate}
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
						noDateHint={noDateHint}
						onDateChange={(dueDate, choice) => {
							onDateChange(dueDate, choice)
							onPickingDateChange(false)
						}}
						onNoDate={
							removeDate &&
							(() => {
								removeDate()
								onPickingDateChange(false)
							})
						}
						today={today}
					/>
				</PopoverContent>
			</Popover>
		</>
	)
}
