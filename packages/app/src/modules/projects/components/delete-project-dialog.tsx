import type { Project } from '@soonlane/contracts'
import { SidebarDeleteDialog } from '../../shell/components/sidebar-delete-dialog'
import { useDeleteProjectMutation } from '../hooks/use-delete-project-mutation'

interface DeleteProjectDialogProps {
	project: Project
	onClose: () => void
	onDeleted: () => void
}

export function DeleteProjectDialog({
	project,
	onClose,
	onDeleted,
}: Readonly<DeleteProjectDialogProps>) {
	const { mutate, isPending } = useDeleteProjectMutation(onDeleted)

	return (
		<SidebarDeleteDialog
			isPending={isPending}
			onClose={onClose}
			onConfirm={() => mutate({ id: project.id }, { onError: onClose })}
			title="Delete project?"
		>
			The &quot;<span className="ph-mask">{project.name}</span>&quot; project
			will be permanently deleted. Its tasks will be kept without a project.
		</SidebarDeleteDialog>
	)
}
