import { TaskListSkeleton } from '@soonlane/app/tasks/components/list/task-list.skeleton'
import { SearchPage } from '@soonlane/app/tasks/components/search/search-page'
import { useToday } from '@soonlane/app/tasks/hooks/use-today'
import { createFileRoute, useLocation } from '@tanstack/react-router'
import { z } from 'zod'

/** The search palette's query, handed over in navigation state so it never reaches the URL. */
const searchStateSchema = z.object({
	searchQuery: z.string().optional().catch(undefined),
	handoffId: z.string().optional().catch(undefined),
})

export const Route = createFileRoute('/_session/_shell/search')({
	head: () => ({ meta: [{ title: 'Search · Soonlane' }] }),
	component: SearchRoute,
})

function SearchRoute() {
	const today = useToday()
	const searchQuery = useLocation({
		select: location => searchStateSchema.parse(location.state).searchQuery,
	})
	const handoffId = useLocation({
		select: location => searchStateSchema.parse(location.state).handoffId,
	})

	if (!today) return <TaskListSkeleton />

	return <SearchPage initialQuery={searchQuery} key={handoffId} today={today} />
}
