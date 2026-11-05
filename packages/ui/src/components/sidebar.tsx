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
				'w-72 shrink-0 flex-col gap-4 overflow-y-auto bg-sidebar px-3 py-2',
				className
			)}
			data-slot="sidebar"
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

/** Row style for sidebar links; apply `state: 'active'` through the router's active props so colors never conflict. */
export const sidebarItemVariants = cva(
	'flex h-9 items-center gap-2.5 rounded-md px-2 text-sm transition-colors [&_svg]:size-4.5 [&_svg]:shrink-0',
	{
		variants: {
			state: {
				active: 'bg-primary-muted text-danger',
				inactive: 'text-foreground hover:bg-hover',
			},
		},
		defaultVariants: { state: 'inactive' },
	}
)
