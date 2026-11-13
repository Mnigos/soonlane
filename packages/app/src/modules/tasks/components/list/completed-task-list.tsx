import type { Task } from '@soonlane/contracts'
import type { CalendarDate } from '@soonlane/domain'
import { useReopenTask } from '../../hooks/use-reopen-task'
import { CompletedTaskItem } from '../task/completed-task-item'

interface CompletedTaskListProps {
	id?: string
	tasks: Task[]
	today: CalendarDate
}

export function CompletedTaskList({
	id,
	tasks,
	today,
}: Readonly<CompletedTaskListProps>) {
	const { reopenTask, isCompleting } = useReopenTask(today)

	return (
		<ul id={id}>
			{tasks.map(task => (
				<CompletedTaskItem
					isDisabled={isCompleting}
					key={task.id}
					onReopen={() => reopenTask(task)}
					task={task}
				/>
			))}
		</ul>
	)
}
