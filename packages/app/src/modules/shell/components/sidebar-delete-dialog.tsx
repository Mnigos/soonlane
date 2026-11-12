import { Button } from '@soonlane/ui/components/button'
import { Dialog } from '@soonlane/ui/components/dialog'
import type { PropsWithChildren } from 'react'

interface SidebarDeleteDialogProps extends PropsWithChildren {
	title: string
	isPending: boolean
	onConfirm: () => void
	onClose: () => void
}

/** Asks before a sidebar item is deleted; the children are the body text. */
export function SidebarDeleteDialog({
	title,
	isPending,
	onConfirm,
	onClose,
	children,
}: Readonly<SidebarDeleteDialogProps>) {
	return (
		<Dialog className="max-w-md p-4" label={title} onClose={onClose}>
			<h2 className="text-base font-semibold">{title}</h2>

			<p className="mt-2 text-sm text-secondary-foreground">{children}</p>

			<div className="mt-6 flex justify-end gap-2">
				<Button onClick={onClose} size="sm" variant="outline">
					Cancel
				</Button>

				<Button disabled={isPending} onClick={onConfirm} size="sm">
					Delete
				</Button>
			</div>
		</Dialog>
	)
}
