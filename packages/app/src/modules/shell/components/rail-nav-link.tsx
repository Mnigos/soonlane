import { sidebarRailItemVariants } from '@soonlane/ui/components/sidebar'
import { Link, type LinkProps } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'

interface RailNavLinkProps {
	to: LinkProps['to']
	label: string
	icon: LucideIcon
}

export function RailNavLink({
	to,
	label,
	icon: Icon,
}: Readonly<RailNavLinkProps>) {
	return (
		<Link
			activeOptions={{ exact: true, includeSearch: false }}
			activeProps={{ className: sidebarRailItemVariants({ state: 'active' }) }}
			aria-label={label}
			inactiveProps={{
				className: sidebarRailItemVariants({ state: 'inactive' }),
			}}
			title={label}
			to={to}
		>
			<Icon aria-hidden />
		</Link>
	)
}
