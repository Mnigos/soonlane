import type { PropsWithChildren } from 'react'
import { cn } from '../utils/cn.util'

interface DialogProps extends PropsWithChildren {
	label: string
	onClose: () => void
	className?: string
}

function openAsModal(dialog: HTMLDialogElement | null) {
	if (dialog && !dialog.open) dialog.showModal()
}

/** A native modal dialog that opens when mounted; Escape or `close()` call `onClose`. Render it only while open. */
export function Dialog({
	label,
	onClose,
	className,
	children,
}: Readonly<DialogProps>) {
	return (
		<dialog
			aria-label={label}
			className={cn(
				'm-auto w-[calc(100%-2rem)] max-w-xl rounded-lg border bg-background p-0 text-foreground backdrop:bg-black/60',
				className
			)}
			onClose={onClose}
			ref={openAsModal}
		>
			{children}
		</dialog>
	)
}
