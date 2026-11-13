import type { Task } from '@soonlane/contracts'
import type { CalendarDate } from '@soonlane/domain'
import { Skeleton } from '@soonlane/ui/components/skeleton'
import { TaskTreeItem } from '../task/task-tree-item'

interface TaskListProps {
	tasks: Task[]
	today: CalendarDate
	isLoading: boolean
	onComplete: (task: Task) => void
	/** Names each task's due day, for a list without day headings. */
	showsDueDay?: boolean
}

export function TaskList({
	tasks,
	today,
	isLoading,
	onComplete,
	showsDueDay,
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
				<TaskTreeItem
					key={task.id}
					onComplete={onComplete}
					showsDueDay={showsDueDay}
					task={task}
					today={today}
				/>
			))}
		</ul>
	)
}
