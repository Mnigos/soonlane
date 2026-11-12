import { safe } from '@orpc/client'
import { LabelPage } from '@soonlane/app/tasks/components/label/label-page'
import { TaskListSkeleton } from '@soonlane/app/tasks/components/list/task-list.skeleton'
import { getTaskViewTitle } from '@soonlane/app/tasks/helpers/task-view.helper'
import { useToday } from '@soonlane/app/tasks/hooks/use-today'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_session/app/labels/$name')({
	loader: async ({ context }) => {
		const { data } = await safe(
			context.queryClient.query(context.orpc.labels.list.queryOptions())
		)

		return data
	},
	head: ({ loaderData, params }) => {
		const title = getTaskViewTitle(
			loaderData?.labels,
			params.name,
			'Label not found'
		)

		return { meta: [{ title: `${title} · Soonlane` }] }
	},
	component: LabelRoute,
})

function LabelRoute() {
	const { name } = Route.useParams()
	const today = useToday()

	if (!today) return <TaskListSkeleton />

	return <LabelPage key={today} name={name} today={today} />
}
