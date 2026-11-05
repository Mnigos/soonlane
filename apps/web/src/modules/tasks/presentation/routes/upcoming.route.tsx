import { toCalendarDate } from '@soonlist/domain'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { TaskListSkeleton } from '../components/list/task-list.skeleton'
import { UpcomingPage } from '../components/upcoming/upcoming-page'
import { useToday } from '../hooks/use-today'

const upcomingSearchSchema = z.object({
	week: z.iso.date().optional().catch(undefined),
})

export const Route = createFileRoute('/_app/')({
	validateSearch: upcomingSearchSchema,
	head: () => ({ meta: [{ title: 'Upcoming · Soonlist' }] }),
	component: UpcomingRoute,
})

function UpcomingRoute() {
	const { week } = Route.useSearch()
	const today = useToday()

	if (!today) return <TaskListSkeleton />

	return (
		<UpcomingPage
			today={today}
			week={week ? toCalendarDate(week) : undefined}
		/>
	)
}
