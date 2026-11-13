import type { DatePickerChoice } from '@soonlane/analytics'
import type { Task } from '@soonlane/contracts'
import {
	type CalendarDate,
	getDueChipLabel,
	getDueLabel,
	TASK_PRIORITIES,
	type TaskPriority,
} from '@soonlane/domain'
import { cn } from '@soonlane/ui/cn'
import { Check, ChevronRight } from 'lucide-react'
import { type KeyboardEvent, useId, useRef, useState } from 'react'
import { getHostPorts } from '../../../../host-ports.client'
import { isShortcutKeydown } from '../../../../utils/keyboard-shortcut.util'
import { getMenuEdit } from '../../helpers/task-edit.helper'
import { keepFocusAfterMove } from '../../helpers/task-focus.helper'
import { PRIORITY_CIRCLE_CLASSES } from '../../helpers/task-priority.constants'
import { useOpenEditor } from '../../hooks/use-open-editor'
import { useUpdateTask } from '../../hooks/use-update-task'
import { TaskComposer } from '../composer/task-composer'
import { GoalProgress } from './goal-progress'
import { LogProgressControls } from './log-progress-controls'
import { TaskMeta } from './task-meta'
import { TaskRowMenu } from './task-row-menu'

export interface TaskItemProps {
	task: Task
	today: CalendarDate
	onComplete: (task: Task) => void
	/** Names the due day in the due line, for a list without day headings. */
	showsDueDay?: boolean
	/** Under its parent's subtasks, which leave out the link to the parent. */
	isInParent?: boolean
	/** This row's own editor id: a subtask can show both on its day and under its parent, and only the row chosen opens its card. */
	editorId: string
	/** Whether its subtasks show under it; a task with subtasks has a chevron that toggles them. */
	isExpanded: boolean
	onExpandedChange: (isExpanded: boolean) => void
	onAddSubtask: () => void
}

/** Row controls show on hover and focus, always on touch screens; the negative margin keeps the row height. */
const ROW_CONTROL_CLASS =
	'-my-1.5 opacity-0 group-focus-within/task:opacity-100 group-hover/task:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100'

export function TaskItem({
	task,
	today,
	onComplete,
	showsDueDay,
	isInParent,
	editorId,
	isExpanded,
	onExpandedChange,
	onAddSubtask,
}: Readonly<TaskItemProps>) {
	const { capture } = getHostPorts()
	const { openEditorId, setOpenEditorId } = useOpenEditor()
	const isEditing = openEditorId === editorId
	const [shouldFocusMenu, setShouldFocusMenu] = useState(false)
	const due =
		task.dueDate &&
		(showsDueDay
			? getDueChipLabel(task.dueDate, task, today)
			: getDueLabel(task.dueDate, task, today))
	const buttonId = useId()
	const titleId = useId()
	const { updateTask } = useUpdateTask(today)
	const [isPickingDate, setIsPickingDate] = useState(false)
	const triggerRef = useRef<HTMLButtonElement>(null)

	function openComposer() {
		setOpenEditorId(editorId)
		setShouldFocusMenu(false)
	}

	function closeComposer() {
		setOpenEditorId(undefined)
		setShouldFocusMenu(true)
	}

	/** Focus moves to the "…" before the save, so it follows the task when the new date moves its row to another list. */
	function changeDate(
		dueDate: CalendarDate | undefined,
		choice: DatePickerChoice
	) {
		triggerRef.current?.focus()
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

	/** The selected row's shortcuts; Enter on its own buttons keeps their native press. */
	function handleRowKeys(event: KeyboardEvent<HTMLLIElement>) {
		if (event.repeat || !isShortcutKeydown(event.nativeEvent)) return

		const priority = TASK_PRIORITIES.find(value => String(value) === event.key)
		const key = event.key.toLowerCase()

		if (priority) changePriority(priority)
		else if (key === 't') setIsPickingDate(true)
		else if (key === 'e') {
			// The row, not one of its buttons, takes focus to the next row once it leaves.
			event.currentTarget.focus()
			onComplete(task)
		} else if (key === 'enter' && event.target === event.currentTarget)
			openComposer()
		else return

		event.preventDefault()
	}

	if (isEditing)
		return (
			<li ref={keepFocusAfterMove}>
				<TaskComposer
					defaultDueDate={task.dueDate}
					defaultLabels={task.labels}
					onCancel={closeComposer}
					onSaved={closeComposer}
					source="task_row"
					task={task}
					today={today}
				/>
			</li>
		)

	// "Complete <title>" without the title in an attribute, which replay masking would not hide.
	return (
		// oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- the row takes focus only from J and K, then its keys act on the task
		<li
			className="group/task relative flex scroll-mt-36 gap-2.5 rounded-xs border-b py-2.5 outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary focus-visible:outline-solid"
			data-task-id={task.id}
			onKeyDown={handleRowKeys}
			ref={keepFocusAfterMove}
			tabIndex={-1}
		>
			{task.subtasks && (
				<button
					aria-expanded={isExpanded}
					aria-label={isExpanded ? 'Hide subtasks' : 'Show subtasks'}
					className="absolute top-2.25 -left-6 flex size-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
					onClick={() => onExpandedChange(!isExpanded)}
					type="button"
				>
					<ChevronRight
						aria-hidden
						className={cn(
							'size-4 transition-transform duration-150 ease-out motion-reduce:transition-none',
							isExpanded && 'rotate-90'
						)}
					/>
				</button>
			)}

			<button
				aria-label="Complete"
				aria-labelledby={`${buttonId} ${titleId}`}
				className={cn(
					'group mt-0.5 flex size-4.5 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition-colors',
					PRIORITY_CIRCLE_CLASSES[task.priority]
				)}
				id={buttonId}
				onClick={() => onComplete(task)}
				type="button"
			>
				<Check
					aria-hidden
					className="size-3 opacity-0 transition-opacity group-hover:opacity-100"
					strokeWidth={3}
				/>
			</button>

			<div className="flex min-w-0 flex-1 flex-col gap-0.5">
				<p className="ph-mask text-sm text-foreground" id={titleId}>
					{task.title}
				</p>

				{task.description && (
					<p className="ph-mask truncate text-label text-muted-foreground">
						{task.description}
					</p>
				)}

				{task.goal && <GoalProgress goal={task.goal} />}

				<TaskMeta
					due={due}
					showsParentAs={isInParent ? undefined : 'link'}
					task={task}
				/>
			</div>

			{task.goal && (
				<LogProgressControls task={task} titleId={titleId} today={today} />
			)}

			<TaskRowMenu
				autoFocus={shouldFocusMenu}
				className={ROW_CONTROL_CLASS}
				isPickingDate={isPickingDate}
				onAddSubtask={onAddSubtask}
				onDateChange={changeDate}
				onEdit={openComposer}
				onPickingDateChange={setIsPickingDate}
				onPriorityChange={changePriority}
				task={task}
				today={today}
				triggerRef={triggerRef}
			/>
		</li>
	)
}
