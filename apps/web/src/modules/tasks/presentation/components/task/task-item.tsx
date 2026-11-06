import type { Task } from '@soonlist/contracts'
import { cn } from '@soonlist/ui/cn'
import { Check, Clock } from 'lucide-react'
import { PRIORITY_CIRCLE_CLASSES } from '../../helpers/task-priority.constants'

interface TaskItemProps {
	task: Task
	onComplete: (task: Task) => void
}

export function TaskItem({ task, onComplete }: Readonly<TaskItemProps>) {
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

				{task.dueTime && (
					<p className="flex items-center gap-1 text-caption text-muted-foreground">
						<Clock aria-hidden className="size-3" />
						{task.dueTime}
					</p>
				)}
			</div>
		</li>
	)
}
