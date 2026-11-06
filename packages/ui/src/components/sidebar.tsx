import { cva } from 'class-variance-authority'
import { ChevronDown } from 'lucide-react'
import {
	type ComponentProps,
	type PropsWithChildren,
	type ReactNode,
	useId,
} from 'react'
import { cn } from '../utils/cn.util'

export function Sidebar({
	className,
	...props
}: Readonly<ComponentProps<'aside'>>) {
	return (
		<aside
			className={cn(
				'w-56 shrink-0 flex-col gap-3 overflow-y-auto bg-sidebar px-2 py-2',
				className
			)}
			data-slot="sidebar"
			{...props}
		/>
	)
}

/** The collapsed sidebar: a column of icon buttons and links, each with its own label. */
export function SidebarRail({
	className,
	...props
}: Readonly<ComponentProps<'aside'>>) {
	return (
		<aside
			className={cn(
				'w-14 shrink-0 flex-col items-center gap-2 overflow-y-auto bg-sidebar py-2',
				className
			)}
			data-slot="sidebar-rail"
			{...props}
		/>
	)
}

interface SidebarSectionProps extends PropsWithChildren {
	label: string
	isOpen: boolean
	onOpenChange: (isOpen: boolean) => void
	action?: ReactNode
}

/** A group whose heading collapses it, with an optional action (an icon button) at the right. */
export function SidebarSection({
	label,
	isOpen,
	onOpenChange,
	action,
	children,
}: Readonly<SidebarSectionProps>) {
	const headingId = useId()
	const contentId = useId()

	return (
		<section aria-labelledby={headingId} className="flex flex-col gap-0.5">
			<div className="flex h-8 items-center justify-between gap-2">
				<h2
					className="text-sm font-semibold text-muted-foreground"
					id={headingId}
				>
					<button
						aria-controls={contentId}
						aria-expanded={isOpen}
						className="flex h-8 cursor-pointer items-center gap-1 rounded-md px-2 transition-colors hover:text-foreground"
						onClick={() => onOpenChange(!isOpen)}
						type="button"
					>
						{label}
						<ChevronDown
							aria-hidden
							className={cn(
								'size-4 transition-transform',
								!isOpen && '-rotate-90'
							)}
						/>
					</button>
				</h2>

				{action}
			</div>

			{isOpen && (
				<div className="flex flex-col gap-0.5" id={contentId}>
					{children}
				</div>
			)}
		</section>
	)
}

const SIDEBAR_ITEM_STATES = {
	active: 'bg-primary-muted text-danger',
	inactive: 'text-foreground hover:bg-hover',
} as const satisfies Record<string, string>

/** Row style for sidebar links; apply `state: 'active'` through the router's active props so colors never conflict. */
export const sidebarItemVariants = cva(
	'flex h-8 items-center gap-2 rounded-md px-2 text-sm transition-colors [&_svg]:size-4.5 [&_svg]:shrink-0',
	{
		variants: { state: SIDEBAR_ITEM_STATES },
		defaultVariants: { state: 'inactive' },
	}
)

/** Square icon style for rail links and buttons, with the same active and inactive colors as `sidebarItemVariants`. */
export const sidebarRailItemVariants = cva(
	'flex size-9 cursor-pointer items-center justify-center rounded-md transition-colors [&_svg]:size-4.5 [&_svg]:shrink-0',
	{
		variants: { state: SIDEBAR_ITEM_STATES },
		defaultVariants: { state: 'inactive' },
	}
)
