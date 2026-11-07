import { cn } from '@soonlane/ui/cn'

interface DesktopDragRegionProps {
	className?: string
}

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
