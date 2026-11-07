import { Dialog } from '@soonlane/ui/components/dialog'
import { useRef } from 'react'
import { capture } from '@/modules/analytics/presentation/analytics.client'
import { useToday } from '../../hooks/use-today'
import { TaskComposer } from '../composer/task-composer'

interface AddTaskDialogProps {
	onClose: () => void
}

/** The global Add task: the task composer in a dialog, due today by default. */
export function AddTaskDialog({ onClose }: Readonly<AddTaskDialogProps>) {
	const today = useToday()
	// Escape in the composer reaches both the composer and the dialog.
	const isDismissedRef = useRef(false)

	function dismiss() {
		if (isDismissedRef.current) return

		isDismissedRef.current = true
		capture('composer_cancelled', { source: 'sidebar_dialog' })
		onClose()
	}

	return (
		<Dialog className="rounded-xl" label="Add task" onClose={dismiss}>
			{today && (
				<TaskComposer
					autoFocus={false}
					className="my-0 border-0"
					defaultDueDate={today}
					onCancel={dismiss}
					onCreated={onClose}
					source="sidebar_dialog"
					today={today}
				/>
			)}
		</Dialog>
	)
}
