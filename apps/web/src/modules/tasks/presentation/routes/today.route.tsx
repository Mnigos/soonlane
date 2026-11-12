import { useToday } from '@soonlane/app/tasks/hooks/use-today'
import { createFileRoute } from '@tanstack/react-router'
import { TaskListSkeleton } from '../components/list/task-list.skeleton'
import { TodayPage } from '../components/today-page'

export const Route = createFileRoute('/_session/app/today')({
	head: () => ({ meta: [{ title: 'Today · Soonlane' }] }),
	component: TodayRoute,
})

function TodayRoute() {
	const today = useToday()

	if (!today) return <TaskListSkeleton />

	return <TodayPage today={today} />
}
