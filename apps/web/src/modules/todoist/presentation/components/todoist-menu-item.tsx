import { orpcQuery } from '@soonlane/app/rpc-query'
import { useQuery } from '@tanstack/react-query'
import { Import } from 'lucide-react'
import { TODOIST_COPY } from '../helpers/todoist-copy.constants'
import { TodoistImportLink } from './todoist-import-link'

interface TodoistMenuItemProps {
	className: string
}

/** The user menu's way into the import, shown only when this server has a Todoist app. */
export function TodoistMenuItem({ className }: Readonly<TodoistMenuItemProps>) {
	const { data } = useQuery(orpcQuery.todoist.status.queryOptions())

	if (!data?.configured) return null

	return (
		<TodoistImportLink className={className}>
			<Import aria-hidden className="size-4 text-muted-foreground" />

			{TODOIST_COPY.menuEntry}
		</TodoistImportLink>
	)
}
