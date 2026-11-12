import { safe } from '@orpc/client'
import { isLabelNamed } from '@soonlane/app/labels/helpers/label-name.helper'
import { useToday } from '@soonlane/app/tasks/hooks/use-today'
import { createFileRoute } from '@tanstack/react-router'
import { LabelPage } from '@/modules/tasks/presentation/components/label/label-page'
import { TaskListSkeleton } from '@/modules/tasks/presentation/components/list/task-list.skeleton'

export const Route = createFileRoute('/_session/app/labels/$name')({
	loader: async ({ context }) => {
		const { data } = await safe(
			context.queryClient.query(context.orpc.labels.list.queryOptions())
		)

		return data
	},
	head: ({ loaderData, params }) => {
		const label = loaderData?.labels.find(item =>
			isLabelNamed(item, params.name)
		)
		const title = loaderData ? (label?.name ?? 'Label not found') : params.name

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
