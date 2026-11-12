import { TaskListSkeleton } from '@soonlane/app/tasks/components/list/task-list.skeleton'
import { UpcomingPage } from '@soonlane/app/tasks/components/upcoming/upcoming-page'
import { useToday } from '@soonlane/app/tasks/hooks/use-today'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_session/app/')({
	head: () => ({ meta: [{ title: 'Upcoming · Soonlane' }] }),
	component: UpcomingRoute,
})

function UpcomingRoute() {
	const today = useToday()

	if (!today) return <TaskListSkeleton />

	// A new day remounts the page, so the list and the active-day tracker start from the new today.
	return <UpcomingPage key={today} today={today} />
}
