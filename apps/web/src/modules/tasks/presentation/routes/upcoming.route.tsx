import { createFileRoute } from '@tanstack/react-router'
import { TaskListSkeleton } from '../components/list/task-list.skeleton'
import { UpcomingPage } from '../components/upcoming/upcoming-page'
import { useToday } from '../hooks/use-today'

export const Route = createFileRoute('/_shell/')({
	head: () => ({ meta: [{ title: 'Upcoming · Soonlist' }] }),
	component: UpcomingRoute,
})

function UpcomingRoute() {
	const today = useToday()

	if (!today) return <TaskListSkeleton />

	// A new day remounts the page, so the list and the active-day tracker start from the new today.
	return <UpcomingPage key={today} today={today} />
}
