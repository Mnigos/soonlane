import { orpcQuery } from '@soonlane/app/rpc-query'
import { isDesktopShell } from '@soonlane/app/shell/helpers/desktop-host.helper'
import { TODOIST_IMPORT_PATH } from '@soonlane/auth'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Import } from 'lucide-react'
import { toast } from 'sonner'
import { TODOIST_COPY } from '../helpers/todoist-copy.constants'

interface TodoistMenuItemProps {
	className: string
}

/**
 * The user menu's way into the import, shown only when this server has a Todoist app. The desktop app opens it in
 * the system browser, which holds the OAuth state cookie and the session; the window keeps its page.
 */
export function TodoistMenuItem({ className }: Readonly<TodoistMenuItemProps>) {
	const { data } = useQuery(orpcQuery.todoist.status.queryOptions())
	const isDesktop = isDesktopShell()

	if (!data?.configured) return null

	return (
		<Link
			className={className}
			onClick={() => {
				if (isDesktop) toast(TODOIST_COPY.desktopOpenedInBrowser)
			}}
			target={isDesktop ? '_blank' : undefined}
			to={TODOIST_IMPORT_PATH}
		>
			<Import aria-hidden className="size-4 text-muted-foreground" />
			{TODOIST_COPY.menuEntry}
		</Link>
	)
}
