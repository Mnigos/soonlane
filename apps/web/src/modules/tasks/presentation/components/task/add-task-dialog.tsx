import { Dialog } from '@soonlist/ui/components/dialog'
import { useToday } from '../../hooks/use-today'
import { TaskComposer } from '../composer/task-composer'

interface AddTaskDialogProps {
	onClose: () => void
}

/** The global Add task: the task composer in a dialog, due today by default. */
export function AddTaskDialog({ onClose }: Readonly<AddTaskDialogProps>) {
	const today = useToday()

	return (
		<Dialog label="Add task" onClose={onClose}>
			{today && (
				<TaskComposer
					autoFocus={false}
					className="my-0 border-0"
					defaultDueDate={today}
					onCancel={onClose}
					onCreated={onClose}
					today={today}
				/>
			)}
		</Dialog>
	)
}
