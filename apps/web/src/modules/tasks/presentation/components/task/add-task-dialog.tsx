import { Dialog } from '@soonlist/ui/components/dialog'
import { useToday } from '../../hooks/use-today'
import { TaskQuickAdd } from './task-quick-add'

interface AddTaskDialogProps {
	onClose: () => void
}

/** The global Add task: the quick add form in a dialog, due today by default. */
export function AddTaskDialog({ onClose }: Readonly<AddTaskDialogProps>) {
	const today = useToday()

	return (
		<Dialog label="Add task" onClose={onClose}>
			{today && (
				<TaskQuickAdd
					className="my-0 border-0"
					defaultDueDate={today}
					onCancel={onClose}
					onCreated={onClose}
				/>
			)}
		</Dialog>
	)
}
