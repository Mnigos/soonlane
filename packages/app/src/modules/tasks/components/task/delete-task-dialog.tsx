import type { Task } from '@soonlane/contracts'
import type { CalendarDate } from '@soonlane/domain'
import { Button } from '@soonlane/ui/components/button'
import { Dialog } from '@soonlane/ui/components/dialog'
import { useDeleteTask } from '../../hooks/use-delete-task'

interface DeleteTaskDialogProps {
	task: Task
	today: CalendarDate
	onClose: () => void
	onDeleted?: () => void
}

/** Closes on Delete without waiting for the server: the task leaves the lists at once. */
export function DeleteTaskDialog({
	task,
	today,
	onClose,
	onDeleted,
}: Readonly<DeleteTaskDialogProps>) {
	const { deleteTask } = useDeleteTask(today)

	return (
		<Dialog className="max-w-md p-4" label="Delete task?" onClose={onClose}>
			<h2 className="text-base font-semibold">Delete task?</h2>

			<p className="mt-2 text-sm text-secondary-foreground">
				The &quot;<span className="ph-mask">{task.title}</span>&quot; task
				{task.subtasks
					? ' and its subtasks will be permanently deleted.'
					: ' will be permanently deleted.'}
			</p>

			<div className="mt-6 flex justify-end gap-2">
				<Button onClick={onClose} size="sm" variant="outline">
					Cancel
				</Button>

				<Button
					onClick={() => {
						deleteTask(task)
						onClose()
						onDeleted?.()
					}}
					size="sm"
				>
					Delete
				</Button>
			</div>
		</Dialog>
	)
}
