import { TaskListSkeleton } from '@soonlane/app/tasks/components/list/task-list.skeleton'
import { SearchPage } from '@soonlane/app/tasks/components/search/search-page'
import { useToday } from '@soonlane/app/tasks/hooks/use-today'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_session/app/search')({
	head: () => ({ meta: [{ title: 'Search · Soonlane' }] }),
	component: SearchRoute,
})

function SearchRoute() {
	const today = useToday()

	if (!today) return <TaskListSkeleton />

	return <SearchPage today={today} />
}
