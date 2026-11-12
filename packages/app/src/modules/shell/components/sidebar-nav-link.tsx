import { sidebarItemVariants } from '@soonlane/ui/components/sidebar'
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
			activeProps={{ className: sidebarItemVariants({ state: 'active' }) }}
			inactiveProps={{ className: sidebarItemVariants({ state: 'inactive' }) }}
			onClick={onNavigate}
			to={to}
		>
			<Icon aria-hidden />
			{label}
		</Link>
	)
}
