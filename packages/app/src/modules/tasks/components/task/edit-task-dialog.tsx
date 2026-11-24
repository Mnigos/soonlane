import type { Task } from '@soonlane/contracts'
import { Dialog } from '@soonlane/ui/components/dialog'
import { useQuery } from '@tanstack/react-query'
import { orpcQuery } from '../../../../rpc-query.client'
import { useToday } from '../../hooks/use-today'
import { TaskComposer } from '../composer/task-composer'

interface EditTaskDialogProps {
	task: Task
	onClose: () => void
}

/** A task's edit card in a dialog, for a task opened from the search palette or a parent link; it follows the task's cached `tasks.get` entry, which pinning a Linear issue writes. */
export function EditTaskDialog({
	task,
	onClose,
}: Readonly<EditTaskDialogProps>) {
	const today = useToday()
	const { data } = useQuery(
		orpcQuery.tasks.get.queryOptions({
			input: { id: task.id },
			initialData: { task },
		})
	)

	return (
		<Dialog className="rounded-xl" label="Edit task" onClose={onClose}>
			{today && (
				<TaskComposer
					autoFocus={false}
					className="my-0 border-0"
					defaultDueDate={task.dueDate}
					defaultLabels={task.labels}
					onCancel={onClose}
					onDeleted={onClose}
					onSaved={onClose}
					source="task_row"
					task={data.task}
					today={today}
				/>
			)}
		</Dialog>
	)
}
