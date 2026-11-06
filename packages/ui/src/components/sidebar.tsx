import { cva } from 'class-variance-authority'
import { type ComponentProps, type PropsWithChildren, useId } from 'react'
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
}

export function SidebarSection({
	label,
	children,
}: Readonly<SidebarSectionProps>) {
	const headingId = useId()

	return (
		<section aria-labelledby={headingId} className="flex flex-col gap-1">
			<h2
				className="px-2 text-sm font-semibold text-muted-foreground"
				id={headingId}
			>
				{label}
			</h2>

			{children}
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
