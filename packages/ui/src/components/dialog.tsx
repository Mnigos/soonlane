import { Dialog as BaseDialog } from '@base-ui/react/dialog'
import type { PropsWithChildren } from 'react'
import { cn } from '../utils/cn.util'

interface DialogProps extends PropsWithChildren {
	label: string
	onClose: () => void
	className?: string
}

/** A modal dialog that is open while mounted; Escape or a click on the backdrop call `onClose`. Render it only while open. */
export function Dialog({
	label,
	onClose,
	className,
	children,
}: Readonly<DialogProps>) {
	return (
		<BaseDialog.Root
			onOpenChange={isOpen => {
				if (!isOpen) onClose()
			}}
			open
		>
			<BaseDialog.Portal>
				<BaseDialog.Backdrop className="fixed inset-0 z-50 bg-black/60" />

				<BaseDialog.Popup
					aria-label={label}
					aria-modal
					className={cn(
						'fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-1/2 rounded-lg border bg-background text-foreground outline-none',
						className
					)}
				>
					{children}
				</BaseDialog.Popup>
			</BaseDialog.Portal>
		</BaseDialog.Root>
	)
}
