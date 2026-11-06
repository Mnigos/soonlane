import type { Task } from '@soonlane/contracts'
import { type CalendarDate, toCalendarDate } from '@soonlane/domain'
import { cn } from '@soonlane/ui/cn'
import { Calendar, Check } from 'lucide-react'
import { getDueLabel } from '../../../domain/due-label.helper'
import { DUE_TONE_CLASSES } from '../../helpers/due-tone.constants'
import { PRIORITY_CIRCLE_CLASSES } from '../../helpers/task-priority.constants'

interface TaskItemProps {
	task: Task
	today: CalendarDate
	onComplete: (task: Task) => void
}

export function TaskItem({ task, today, onComplete }: Readonly<TaskItemProps>) {
	const due = getDueLabel(toCalendarDate(task.dueDate), task.dueTime, today)

	return (
		<li className="flex gap-2.5 border-b py-2.5">
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
		</li>
	)
}
