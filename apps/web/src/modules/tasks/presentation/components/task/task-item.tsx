import type { Task } from '@soonlane/contracts'
import { type CalendarDate, toCalendarDate } from '@soonlane/domain'
import { cn } from '@soonlane/ui/cn'
import { Tooltip } from '@soonlane/ui/components/tooltip'
import { Calendar, Check, PencilLine } from 'lucide-react'
import { useState } from 'react'
import { getDueLabel } from '../../../domain/due-label.helper'
import { CHIP_ICON_STROKE } from '../../helpers/composer-chip.constants'
import { DUE_TONE_CLASSES } from '../../helpers/due-tone.constants'
import { PRIORITY_CIRCLE_CLASSES } from '../../helpers/task-priority.constants'
import { TaskComposer } from '../composer/task-composer'

interface TaskItemProps {
	task: Task
	today: CalendarDate
	onComplete: (task: Task) => void
}

export function TaskItem({ task, today, onComplete }: Readonly<TaskItemProps>) {
	const [isEditing, setIsEditing] = useState(false)
	const due = getDueLabel(toCalendarDate(task.dueDate), task.dueTime, today)

	if (isEditing)
		return (
			<li>
				<TaskComposer
					defaultDueDate={toCalendarDate(task.dueDate)}
					onCancel={() => setIsEditing(false)}
					onSaved={() => setIsEditing(false)}
					task={task}
					today={today}
				/>
			</li>
		)

	return (
		<li className="group/task flex gap-2.5 border-b py-2.5">
			<button
				aria-label={`Complete ${task.title}`}
				className={cn(
					'group mt-0.5 flex size-4.5 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition-colors',
					PRIORITY_CIRCLE_CLASSES[task.priority]
				)}
				onClick={() => onComplete(task)}
				type="button"
			>
				<Check
					aria-hidden
					className="size-3 opacity-0 transition-opacity group-hover:opacity-100"
					strokeWidth={3}
				/>
			</button>

			<div className="flex min-w-0 flex-col gap-0.5">
				<p className="text-sm text-foreground">{task.title}</p>

				{task.description && (
					<p className="truncate text-label text-muted-foreground">
						{task.description}
					</p>
				)}

				{due && (
					<p
						className={cn(
							'flex items-center gap-1 text-caption',
							DUE_TONE_CLASSES[due.tone]
						)}
					>
						<Calendar aria-hidden className="size-3" />
						{due.text}
					</p>
				)}
			</div>

			{/* Shown on hover or focus, always on touch screens; the negative margin keeps the row height. */}
			<Tooltip label="Edit task">
				<button
					aria-label="Edit task"
					className="-my-1.5 ml-auto flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-secondary-foreground opacity-0 transition group-focus-within/task:opacity-100 group-hover/task:opacity-100 hover:bg-hover focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-primary pointer-coarse:opacity-100"
					onClick={() => setIsEditing(true)}
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
