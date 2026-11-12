import type { DatePickerChoice } from '@soonlane/analytics'
import { capture } from '@soonlane/analytics/client'
import { LABEL_COLOR_CLASSES } from '@soonlane/app/labels/helpers/label-color.constants'
import { RepeatIcon } from '@soonlane/app/tasks/components/composer/date-picker-icons'
import { TaskComposer } from '@soonlane/app/tasks/components/composer/task-composer'
import { DUE_TONE_CLASSES } from '@soonlane/app/tasks/helpers/due-tone.constants'
import { getMenuEdit } from '@soonlane/app/tasks/helpers/task-edit.helper'
import { keepFocusAfterMove } from '@soonlane/app/tasks/helpers/task-focus.helper'
import { PRIORITY_CIRCLE_CLASSES } from '@soonlane/app/tasks/helpers/task-priority.constants'
import { useUpdateTask } from '@soonlane/app/tasks/hooks/use-update-task'
import { isShortcutKeydown } from '@soonlane/app/utils/keyboard-shortcut.util'
import type { Task } from '@soonlane/contracts'
import {
	type CalendarDate,
	getDueChipLabel,
	getDueLabel,
	formatRepeatRule,
	TASK_PRIORITIES,
	type TaskPriority,
} from '@soonlane/domain'
import { cn } from '@soonlane/ui/cn'
import { Calendar, Check, Tag } from 'lucide-react'
import { type KeyboardEvent, useId, useRef, useState } from 'react'
import { useOpenEditor } from '../../hooks/use-open-editor'
import { GoalProgress } from './goal-progress'
import { LogProgressControls } from './log-progress-controls'
import { TaskRowMenu } from './task-row-menu'

interface TaskItemProps {
	task: Task
	today: CalendarDate
	onComplete: (task: Task) => void
	/** Names the due day in the due line, for a list without day headings. */
	showsDueDay?: boolean
}

/** Row controls show on hover and focus, always on touch screens; the negative margin keeps the row height. */
const ROW_CONTROL_CLASS =
	'-my-1.5 opacity-0 group-focus-within/task:opacity-100 group-hover/task:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100'

export function TaskItem({
	task,
	today,
	onComplete,
	showsDueDay,
}: Readonly<TaskItemProps>) {
	const { openEditorId, setOpenEditorId } = useOpenEditor()
	const isEditing = openEditorId === task.id
	const [shouldFocusMenu, setShouldFocusMenu] = useState(false)
	const due = showsDueDay
		? getDueChipLabel(task.dueDate, task.dueTime, today)
		: getDueLabel(task.dueDate, task.dueTime, today)
	const repeatText = task.repeat && formatRepeatRule(task.repeat, 'long')
	const buttonId = useId()
	const titleId = useId()
	const { updateTask } = useUpdateTask(today)
	const [isPickingDate, setIsPickingDate] = useState(false)
	const triggerRef = useRef<HTMLButtonElement>(null)

	function openComposer() {
		setOpenEditorId(task.id)
		setShouldFocusMenu(false)
	}

	function closeComposer() {
		setOpenEditorId(undefined)
		setShouldFocusMenu(true)
	}

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
			className="group/task flex scroll-mt-36 gap-2.5 rounded-xs border-b py-2.5 outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary focus-visible:outline-solid"
			data-task-id={task.id}
			onKeyDown={handleRowKeys}
			ref={keepFocusAfterMove}
			tabIndex={-1}
		>
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

				{(due || repeatText || task.labels.length > 0) && (
					<p className="flex flex-wrap items-center gap-x-2 text-caption">
						{(due || repeatText) && (
							<span
								className={cn(
									'flex items-center gap-1',
									due ? DUE_TONE_CLASSES[due.tone] : 'text-muted-foreground'
								)}
							>
								{due && (
									<>
										<Calendar aria-hidden className="size-3" />

										{due.text}
									</>
								)}

								{repeatText && (
									<>
										<RepeatIcon className="size-3" />

										<span className="sr-only">Repeats: {repeatText}</span>
									</>
								)}
							</span>
						)}

						{task.labels.map(label => (
							<span
								className={cn(
									'flex items-center gap-0.5',
									LABEL_COLOR_CLASSES[label.color ?? 'charcoal']
								)}
								key={label.id}
							>
								<Tag aria-hidden className="size-3" />
								<span className="ph-mask">{label.name}</span>
							</span>
						))}
					</p>
				)}
			</div>

			{task.goal && (
				<LogProgressControls task={task} titleId={titleId} today={today} />
			)}

			<TaskRowMenu
				autoFocus={shouldFocusMenu}
				className={ROW_CONTROL_CLASS}
				isPickingDate={isPickingDate}
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
