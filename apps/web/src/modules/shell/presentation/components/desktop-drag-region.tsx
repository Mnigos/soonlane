import { cn } from '@soonlane/ui/cn'

interface DesktopDragRegionProps {
	className?: string
}

/** The strip under the macOS traffic lights; it renders only in the desktop shell and moves the window. */
export function DesktopDragRegion({
	className,
}: Readonly<DesktopDragRegionProps>) {
	return (
		<div
			aria-hidden
			className={cn(
				'absolute inset-x-0 top-0 hidden h-8 app-drag desktop:block',
				className
			)}
		/>
	)
}
