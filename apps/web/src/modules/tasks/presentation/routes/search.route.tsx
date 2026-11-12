import { useToday } from '@soonlane/app/tasks/hooks/use-today'
import { createFileRoute } from '@tanstack/react-router'
import { TaskListSkeleton } from '../components/list/task-list.skeleton'
import { SearchPage } from '../components/search/search-page'

export const Route = createFileRoute('/_session/app/search')({
	head: () => ({ meta: [{ title: 'Search · Soonlane' }] }),
	component: SearchRoute,
})

function SearchRoute() {
	const today = useToday()

	if (!today) return <TaskListSkeleton />

	return <SearchPage today={today} />
}
