import { InboxPage } from '@soonlane/app/tasks/components/inbox-page'
import { TaskListSkeleton } from '@soonlane/app/tasks/components/list/task-list.skeleton'
import { useToday } from '@soonlane/app/tasks/hooks/use-today'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_session/_shell/inbox')({
	head: () => ({ meta: [{ title: 'Inbox · Soonlane' }] }),
	component: InboxRoute,
})

function InboxRoute() {
	const today = useToday()

	if (!today) return <TaskListSkeleton />

	return <InboxPage today={today} />
}
