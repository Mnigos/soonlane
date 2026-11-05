import { Link, type LinkProps } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'

interface SidebarNavLinkProps {
	to: LinkProps['to']
	label: string
	icon: LucideIcon
	onNavigate: () => void
}

export function SidebarNavLink({
	to,
	label,
	icon: Icon,
	onNavigate,
}: Readonly<SidebarNavLinkProps>) {
	return (
		<Link
			activeOptions={{ exact: true, includeSearch: false }}
			activeProps={{
				className: 'bg-primary-muted text-danger hover:bg-primary-muted',
			}}
			className="flex h-9 items-center gap-2.5 rounded-md px-2 text-sm text-foreground transition-colors hover:bg-hover"
			onClick={onNavigate}
			to={to}
		>
			<Icon aria-hidden className="size-4.5" />
			{label}
		</Link>
	)
}
