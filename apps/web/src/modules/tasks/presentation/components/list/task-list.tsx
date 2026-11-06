import type { Task } from '@soonlist/contracts'
import { Skeleton } from '@soonlist/ui/components/skeleton'
import { TaskItem } from '../task/task-item'

interface TaskListProps {
	tasks: Task[]
	isLoading: boolean
	onComplete: (task: Task) => void
}

export function TaskList({
	tasks,
	isLoading,
	onComplete,
}: Readonly<TaskListProps>) {
	if (isLoading)
		return (
			<div aria-busy className="flex flex-col gap-2 border-b py-3">
				<Skeleton className="h-4 w-2/5" />
			</div>
		)

	if (tasks.length === 0) return null

	return (
		<ul>
			{tasks.map(task => (
				<TaskItem key={task.id} onComplete={onComplete} task={task} />
			))}
		</ul>
	)
}
