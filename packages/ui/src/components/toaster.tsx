import { Toaster as SonnerToaster } from 'sonner'

/** Show toasts with `toast()` from `sonner`. */
export function Toaster() {
	return (
		<SonnerToaster
			position="bottom-center"
			theme="dark"
			toastOptions={{
				unstyled: true,
				classNames: {
					toast:
						'flex w-full items-center justify-between gap-4 rounded-md border bg-sidebar px-4 py-3 text-sm text-foreground shadow-lg',
					actionButton:
						'cursor-pointer rounded-md px-2 py-1 text-sm font-semibold text-danger transition-colors hover:bg-hover',
				},
			}}
		/>
	)
}
