import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { TodoistImportPage } from '../components/todoist-import-page'
import { TODOIST_COPY } from '../helpers/todoist-copy.constants'

const todoistSearchSchema = z.object({
	error: z.string().optional().catch(undefined),
})

export const Route = createFileRoute('/_session/app/todoist')({
	validateSearch: todoistSearchSchema,
	head: () => ({ meta: [{ title: `${TODOIST_COPY.introTitle} · Soonlane` }] }),
	component: TodoistRoute,
})

function TodoistRoute() {
	const { error } = Route.useSearch()

	return <TodoistImportPage linkError={error} />
}
