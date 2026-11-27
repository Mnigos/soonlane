import type { DatePickerChoice } from '@soonlane/analytics'
import type { Task } from '@soonlane/contracts'
import {
	type CalendarDate,
	getDueChipLabel,
	getDueLabel,
	TASK_PRIORITIES,
} from '@soonlane/domain'
import { cn } from '@soonlane/ui/cn'
import { ChevronRight } from 'lucide-react'
import { type KeyboardEvent, useId, useRef, useState } from 'react'
import { isShortcutKeydown } from '../../../../utils/keyboard-shortcut.util'
import { keepFocusAfterMove } from '../../helpers/task-focus.helper'
import { useOpenEditor } from '../../hooks/use-open-editor'
import { useTaskMenu } from '../../hooks/use-task-menu'
import { useTaskMenuEdits } from '../../hooks/use-task-menu-edits'
import { TaskComposer } from '../composer/task-composer'
import { CompleteTaskButton } from './complete-task-button'
import { GoalProgress } from './goal-progress'
import { LogProgressControls } from './log-progress-controls'
import { TaskDescription } from './task-description'
import { TaskDetailDialog } from './task-detail-dialog'
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

/** Keeps a row's own buttons and links above the title button, whose click area covers the row. */
const ROW_ABOVE_OPEN_CLASS = 'relative z-10'
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
	const { openEditorId, setOpenEditorId } = useOpenEditor()
	const isEditing = openEditorId === editorId
	const [shouldFocusMenu, setShouldFocusMenu] = useState(false)
	const due =
		task.dueDate &&
		(showsDueDay
			? getDueChipLabel(task.dueDate, task, today)
			: getDueLabel(task.dueDate, task, today))
	const titleId = useId()
	const [isViewing, setIsViewing] = useState(false)
	const { changeDate: changeMenuDate, changePriority } = useTaskMenuEdits(
		task,
		today
	)
	const [isPickingDate, setIsPickingDate] = useState(false)
	const triggerRef = useRef<HTMLButtonElement>(null)
	const { menu, openAtPointer } = useTaskMenu()

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
		changeMenuDate(dueDate, choice)
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

	return (
		// oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- the row takes focus only from J and K, then its keys act on the task
		<li
			className="group/task relative flex scroll-mt-36 gap-2.5 rounded-xs border-b py-2.5 outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary focus-visible:outline-solid"
			data-task-id={task.id}
			onContextMenu={openAtPointer}
			onKeyDown={handleRowKeys}
			ref={keepFocusAfterMove}
			tabIndex={-1}
		>
			{task.subtasks && (
				<button
					aria-expanded={isExpanded}
					aria-label={isExpanded ? 'Hide subtasks' : 'Show subtasks'}
					className="absolute top-2.25 -left-6 z-10 flex size-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
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

			<CompleteTaskButton
				className={ROW_ABOVE_OPEN_CLASS}
				onClick={() => onComplete(task)}
				task={task}
				titleId={titleId}
			/>

			<div className="flex min-w-0 flex-1 flex-col gap-0.5">
				<p className="ph-mask text-sm text-foreground">
					<button
						className="cursor-pointer text-left outline-hidden after:absolute after:inset-0 after:rounded-xs focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-primary focus-visible:after:outline-solid"
						id={titleId}
						onClick={() => setIsViewing(true)}
						type="button"
					>
						{task.title}
					</button>
				</p>

				{task.description && (
					<TaskDescription
						className="truncate text-label leading-5 whitespace-nowrap text-muted-foreground"
						description={task.description}
					/>
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
				className={cn(ROW_CONTROL_CLASS, ROW_ABOVE_OPEN_CLASS)}
				isPickingDate={isPickingDate}
				menu={menu}
				onAddSubtask={onAddSubtask}
				onDateChange={changeDate}
				onEdit={openComposer}
				onPickingDateChange={setIsPickingDate}
				onPriorityChange={changePriority}
				task={task}
				today={today}
				triggerRef={triggerRef}
			/>

			{isViewing && (
				<TaskDetailDialog
					onClose={() => setIsViewing(false)}
					onComplete={onComplete}
					task={task}
					today={today}
				/>
			)}
		</li>
	)
}
