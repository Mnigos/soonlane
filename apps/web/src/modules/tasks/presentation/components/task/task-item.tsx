import type { Task } from '@soonlane/contracts'
import type { CalendarDate } from '@soonlane/domain'
import { cn } from '@soonlane/ui/cn'
import { Tooltip } from '@soonlane/ui/components/tooltip'
import { Calendar, Check, PencilLine, Tag } from 'lucide-react'
import { useId, useState } from 'react'
import { LABEL_COLOR_CLASSES } from '@/modules/labels/presentation/helpers/label-color.constants'
import { getDueLabel } from '../../../domain/due-label.helper'
import { formatRepeatRule } from '../../../domain/repeat-rule.helper'
import { CHIP_ICON_STROKE } from '../../helpers/composer-chip.constants'
import { DUE_TONE_CLASSES } from '../../helpers/due-tone.constants'
import { PRIORITY_CIRCLE_CLASSES } from '../../helpers/task-priority.constants'
import { RepeatIcon } from '../composer/date-picker-icons'
import { TaskComposer } from '../composer/task-composer'
import { GoalProgress } from './goal-progress'
import { LogProgressControls } from './log-progress-controls'

interface TaskItemProps {
	task: Task
	today: CalendarDate
	onComplete: (task: Task) => void
}

// A saved date can move the row to another list or off the page, taking its focused Edit button along.
function keepFocusAfterMove(button: HTMLButtonElement) {
	return () => {
		if (document.activeElement !== button) return

		const movedSelector = `[data-edit-task="${button.dataset.editTask}"]`
		const row = button.closest('li')
		const neighbours = [row?.nextElementSibling, row?.previousElementSibling]
		const section = button.closest('section')

		// After the commit, so the task's row has mounted wherever it moved to.
		queueMicrotask(() => {
			if (document.activeElement !== document.body) return

			const target = [
				document.querySelector<HTMLElement>(movedSelector),
				...neighbours.map(neighbour =>
					neighbour?.querySelector<HTMLElement>('[data-edit-task]')
				),
				section?.querySelector<HTMLElement>('input, button'),
			].find(element => element?.isConnected)

			target?.focus()
		})
	}
}

export function TaskItem({ task, today, onComplete }: Readonly<TaskItemProps>) {
	const [isEditing, setIsEditing] = useState(false)
	const [shouldFocusEdit, setShouldFocusEdit] = useState(false)
	const due = getDueLabel(task.dueDate, task.dueTime, today)
	const repeatText = task.repeat && formatRepeatRule(task.repeat, 'long')
	const buttonId = useId()
	const titleId = useId()

	function closeComposer() {
		setIsEditing(false)
		setShouldFocusEdit(true)
	}

	if (isEditing)
		return (
			<li>
				<TaskComposer
					defaultDueDate={task.dueDate}
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
		<li className="group/task flex gap-2.5 border-b py-2.5">
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
								{label.name}
							</span>
						))}
					</p>
				)}
			</div>

			{task.goal && <LogProgressControls task={task} today={today} />}

			{/* The negative margin keeps the row height. */}
			<Tooltip label="Edit task">
				<button
					aria-label="Edit task"
					autoFocus={shouldFocusEdit}
					className="-my-1.5 ml-auto flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-secondary-foreground opacity-0 transition group-focus-within/task:opacity-100 group-hover/task:opacity-100 hover:bg-hover focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-primary pointer-coarse:opacity-100"
					data-edit-task={task.id}
					onClick={() => setIsEditing(true)}
					ref={keepFocusAfterMove}
					type="button"
				>
					<PencilLine
						aria-hidden
						className="size-4.5"
						strokeWidth={CHIP_ICON_STROKE}
					/>
				</button>
			</Tooltip>
		</li>
	)
}
