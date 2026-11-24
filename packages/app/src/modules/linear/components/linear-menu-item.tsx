import { cn } from '@soonlane/ui/cn'
import {
	Menu,
	MenuContent,
	MenuItem,
	MenuLinkItem,
	MenuSeparator,
	MenuTrigger,
} from '@soonlane/ui/components/menu'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Link2 } from 'lucide-react'
import { orpcQuery } from '../../../rpc-query.client'
import { LINEAR_COPY } from '../helpers/linear-copy.constants'
import { useDisconnectLinearMutation } from '../hooks/use-disconnect-linear-mutation'

const LINEAR_URL = 'https://linear.app'
const STATUS_CLASS = 'ml-auto text-caption text-muted-foreground'

interface LinearMenuItemProps {
	className: string
	/** The web page that starts the link; the desktop app passes its absolute URL, which opens in the system browser. */
	connectHref: string
}

/** The user menu's Linear row, hidden while the status loads or fails and on a server without a Linear app; connected, it opens a submenu beside it with Open Linear and Disconnect. */
export function LinearMenuItem({
	className,
	connectHref,
}: Readonly<LinearMenuItemProps>) {
	const { data } = useQuery(orpcQuery.linear.status.queryOptions())
	const disconnect = useDisconnectLinearMutation()
	const icon = <Link2 aria-hidden className="size-4 text-muted-foreground" />

	if (!data || data.state === 'notConfigured') return null

	if (data.state === 'notConnected')
		return (
			<a className={className} href={connectHref}>
				{icon}
				{LINEAR_COPY.menuConnect}
			</a>
		)

	if (data.state === 'lapsed')
		return (
			<a className={className} href={connectHref}>
				{icon}
				{LINEAR_COPY.menuItem}
				<span className={STATUS_CLASS}>{LINEAR_COPY.lapsedStatus}</span>
			</a>
		)

	return (
		<Menu>
			<MenuTrigger className={cn(className, 'data-popup-open:bg-hover')}>
				{icon}

				{LINEAR_COPY.menuItem}

				<span className={STATUS_CLASS}>{LINEAR_COPY.menuStatusConnected}</span>

				<ChevronRight aria-hidden className="size-4 text-muted-foreground" />
			</MenuTrigger>

			<MenuContent align="start" className="w-55 py-1" side="right">
				<p className="ph-mask truncate px-2 pt-1 pb-1.5 text-caption text-muted-foreground">
					{LINEAR_COPY.submenuCaption.replace('{workspace}', data.workspace)}
				</p>

				<MenuSeparator />

				<MenuLinkItem href={LINEAR_URL} rel="noreferrer" target="_blank">
					{LINEAR_COPY.submenuOpen}
				</MenuLinkItem>

				<MenuItem
					className="text-danger"
					disabled={disconnect.isPending}
					onClick={() => disconnect.mutate()}
				>
					{LINEAR_COPY.submenuDisconnect}
				</MenuItem>
			</MenuContent>
		</Menu>
	)
}
