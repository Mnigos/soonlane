import { ORPCError } from '@orpc/client'
import type { Task } from '@soonlane/contracts'
import { useQueryClient } from '@tanstack/react-query'
import { CornerLeftUp } from 'lucide-react'
import { useState } from 'react'
import { getHostPorts } from '../../../../host-ports.client'
import { orpcQuery } from '../../../../rpc-query.client'
import { EditTaskDialog } from './edit-task-dialog'

interface ParentTaskLinkProps {
	parent: NonNullable<Task['parent']>
	/** Inside a search palette option, which opens on its own and holds no button. */
	isPlainText?: boolean
}

/** A subtask's parent in its meta line, outside the parent's own subtasks; it opens the parent's edit card in a dialog. */
export function ParentTaskLink({
	parent,
	isPlainText,
}: Readonly<ParentTaskLinkProps>) {
	const queryClient = useQueryClient()
	const [openedParent, setOpenedParent] = useState<Task>()
	const name = (
		<>
			<CornerLeftUp aria-hidden className="size-3 shrink-0" />

			<span className="ph-mask truncate">{parent.title}</span>
		</>
	)

	async function openParent() {
		try {
			const { task } = await queryClient.query(
				orpcQuery.tasks.get.queryOptions({
					input: { id: parent.id },
					staleTime: 0,
				})
			)

			setOpenedParent(task)
		} catch (error) {
			getHostPorts().showToast(
				error instanceof ORPCError && error.code === 'NOT_FOUND'
					? error.message
					: "Couldn't open the task. Try again."
			)
		}
	}

	if (isPlainText)
		return (
			<span className="flex min-w-0 items-center gap-0.5 text-muted-foreground">
				{name}
			</span>
		)

	// "Subtask of <title>, open task" without the title in an attribute, which replay masking would not hide.
	return (
		<>
			<button
				className="flex min-w-0 cursor-pointer items-center gap-0.5 rounded-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
				onClick={() => void openParent()}
				type="button"
			>
				<span className="sr-only">Subtask of </span>
				{name}
				<span className="sr-only">, open task</span>
			</button>

			{openedParent && (
				<EditTaskDialog
					onClose={() => setOpenedParent(undefined)}
					task={openedParent}
				/>
			)}
		</>
	)
}
