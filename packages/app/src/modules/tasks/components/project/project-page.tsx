import type { CalendarDate } from '@soonlane/domain'
import { useQuery } from '@tanstack/react-query'
import { orpcQuery } from '../../../../rpc-query.client'
import { isNamed } from '../../helpers/task-view.helper'
import { ProjectViewContext } from '../../project-view.context'
import { TaskView } from '../view/task-view'
import { TaskViewPage } from '../view/task-view-page'

interface ProjectPageProps {
	name: string
	today: CalendarDate
}

export function ProjectPage({ name, today }: Readonly<ProjectPageProps>) {
	const projects = useQuery(orpcQuery.projects.list.queryOptions())

	return (
		<TaskViewPage
			item={projects.data?.projects.find(project => isNamed(project, name))}
			notFoundTitle="Project not found"
			ownerList={projects}
		>
			{project => (
				<ProjectViewContext value={project.id}>
					<TaskView
						composer={{ defaultProject: project, source: 'project_view' }}
						emptyNote="No tasks in this project yet."
						filter={{ projectId: project.id }}
						id={project.id}
						name={project.name}
						ownerListKey={orpcQuery.projects.list.key()}
						today={today}
					/>
				</ProjectViewContext>
			)}
		</TaskViewPage>
	)
}
