import { orpcQuery } from '@soonlane/app/rpc-query'
import { TODOIST_IMPORT_PATH } from '@soonlane/auth'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Import } from 'lucide-react'
import { TODOIST_COPY } from '../helpers/todoist-copy.constants'

interface TodoistMenuItemProps {
	className: string
}

/** The user menu's way into the import, shown only when this server has a Todoist app. */
export function TodoistMenuItem({ className }: Readonly<TodoistMenuItemProps>) {
	const { data } = useQuery(orpcQuery.todoist.status.queryOptions())

	if (!data?.configured) return null

	return (
		<Link className={className} to={TODOIST_IMPORT_PATH}>
			<Import aria-hidden className="size-4 text-muted-foreground" />
			{TODOIST_COPY.menuEntry}
		</Link>
	)
}
