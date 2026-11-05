import { createFileRoute } from '@tanstack/react-router'
import { TaskListSkeleton } from '../components/list/task-list.skeleton'
import { TodayPage } from '../components/today-page'
import { useToday } from '../hooks/use-today'

export const Route = createFileRoute('/_app/today')({
	head: () => ({ meta: [{ title: 'Today · Soonlist' }] }),
	component: TodayRoute,
})

function TodayRoute() {
	const today = useToday()

	if (!today) return <TaskListSkeleton />

	return <TodayPage today={today} />
}
