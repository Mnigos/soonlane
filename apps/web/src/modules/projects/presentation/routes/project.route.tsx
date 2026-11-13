import { safe } from '@orpc/client'
import { TaskListSkeleton } from '@soonlane/app/tasks/components/list/task-list.skeleton'
import { ProjectPage } from '@soonlane/app/tasks/components/project/project-page'
import { getTaskViewTitle } from '@soonlane/app/tasks/helpers/task-view.helper'
import { useToday } from '@soonlane/app/tasks/hooks/use-today'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_session/_shell/projects/$name')({
	loader: async ({ context }) => {
		const { data } = await safe(
			context.queryClient.query(context.orpc.projects.list.queryOptions())
		)

		return data
	},
	head: ({ loaderData, params }) => {
		const title = getTaskViewTitle(
			loaderData?.projects,
			params.name,
			'Project not found'
		)

		return { meta: [{ title: `${title} · Soonlane` }] }
	},
	component: ProjectRoute,
})

function ProjectRoute() {
	const { name } = Route.useParams()
	const today = useToday()

	if (!today) return <TaskListSkeleton />

	return <ProjectPage key={today} name={name} today={today} />
}
