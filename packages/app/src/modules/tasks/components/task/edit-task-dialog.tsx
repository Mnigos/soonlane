import type { Task } from '@soonlane/contracts'
import { Dialog } from '@soonlane/ui/components/dialog'
import { useToday } from '../../hooks/use-today'
import { TaskComposer } from '../composer/task-composer'

interface EditTaskDialogProps {
	task: Task
	onClose: () => void
}

/** A task's edit card in a dialog, for a task opened from the search palette. */
export function EditTaskDialog({
	task,
	onClose,
}: Readonly<EditTaskDialogProps>) {
	const today = useToday()

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
					task={task}
					today={today}
				/>
			)}
		</Dialog>
	)
}
