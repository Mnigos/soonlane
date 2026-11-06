import type { Label } from '@soonlane/contracts'
import { Button } from '@soonlane/ui/components/button'
import { Dialog } from '@soonlane/ui/components/dialog'
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
		<Dialog className="max-w-md p-4" label="Delete label?" onClose={onClose}>
			<h2 className="text-base font-semibold">Delete label?</h2>

			<p className="mt-2 text-sm text-secondary-foreground">
				{`The "${label.name}" label will be permanently deleted and removed from its tasks.`}
			</p>

			<div className="mt-6 flex justify-end gap-2">
				<Button onClick={onClose} size="sm" variant="outline">
					Cancel
				</Button>

				<Button
					disabled={isPending}
					onClick={() => mutate({ id: label.id }, { onError: onClose })}
					size="sm"
				>
					Delete
				</Button>
			</div>
		</Dialog>
	)
}
