import type { Label } from '@soonlane/contracts'
import { SidebarDeleteDialog } from '../../shell/components/sidebar-delete-dialog'
import { useDeleteLabelMutation } from '../hooks/use-delete-label-mutation'

interface DeleteLabelDialogProps {
	label: Label
	onClose: () => void
	onDeleted: () => void
}

export function DeleteLabelDialog({
	label,
	onClose,
	onDeleted,
}: Readonly<DeleteLabelDialogProps>) {
	const { mutate, isPending } = useDeleteLabelMutation(onDeleted)

	return (
		<SidebarDeleteDialog
			isPending={isPending}
			onClose={onClose}
			onConfirm={() => mutate({ id: label.id }, { onError: onClose })}
			title="Delete label?"
		>
			The &quot;<span className="ph-mask">{label.name}</span>&quot; label will
			be permanently deleted and removed from its tasks.
		</SidebarDeleteDialog>
	)
}
