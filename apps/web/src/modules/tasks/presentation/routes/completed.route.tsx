import { CompletedPage } from '@soonlane/app/tasks/components/completed/completed-page'
import { TaskListSkeleton } from '@soonlane/app/tasks/components/list/task-list.skeleton'
import { useToday } from '@soonlane/app/tasks/hooks/use-today'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_session/app/completed')({
	head: () => ({ meta: [{ title: 'Completed · Soonlane' }] }),
	component: CompletedRoute,
})

function CompletedRoute() {
	const today = useToday()

	if (!today) return <TaskListSkeleton />

	return <CompletedPage today={today} />
}
