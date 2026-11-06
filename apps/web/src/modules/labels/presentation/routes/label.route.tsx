import { createFileRoute } from '@tanstack/react-router'
import { LabelPage } from '@/modules/tasks/presentation/components/label/label-page'
import { TaskListSkeleton } from '@/modules/tasks/presentation/components/list/task-list.skeleton'
import { useToday } from '@/modules/tasks/presentation/hooks/use-today'
import { isLabelNamed } from '../helpers/label-name.helper'

export const Route = createFileRoute('/app/labels/$name')({
	// Loaded for the tab title; a failed load reaches the page, which offers Try again.
	loader: async ({ context }) =>
		await context.queryClient
			.query(context.orpc.labels.list.queryOptions())
			.catch(() => undefined),
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

	// A new day remounts the page, so the list and an open composer start from the new today.
	return <LabelPage key={today} name={name} today={today} />
}
