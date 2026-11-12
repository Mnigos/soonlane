import { TaskListSkeleton } from '@soonlane/app/tasks/components/list/task-list.skeleton'
import { TodayPage } from '@soonlane/app/tasks/components/today-page'
import { useToday } from '@soonlane/app/tasks/hooks/use-today'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_session/app/today')({
	head: () => ({ meta: [{ title: 'Today · Soonlane' }] }),
	component: TodayRoute,
})

function TodayRoute() {
	const today = useToday()

	if (!today) return <TaskListSkeleton />

	return <TodayPage today={today} />
}
