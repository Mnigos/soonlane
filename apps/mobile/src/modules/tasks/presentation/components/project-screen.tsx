import { orpcQuery } from '@soonlane/app/rpc-query'
import { isNamed } from '@soonlane/app/tasks/helpers/task-view.helper'
import { ProjectViewContext } from '@soonlane/app/tasks/project-view'
import type { CalendarDate } from '@soonlane/domain'
import { useQuery } from '@tanstack/react-query'
import { TaskView } from './task-view'
import { TaskViewScreen } from './task-view-screen'

interface ProjectScreenProps {
	name: string
	today: CalendarDate
}

export function ProjectScreen({ name, today }: Readonly<ProjectScreenProps>) {
	const projects = useQuery(orpcQuery.projects.list.queryOptions())

	return (
		<TaskViewScreen
			item={projects.data?.projects.find(project => isNamed(project, name))}
			name={name}
			notFoundTitle="Project not found"
			ownerList={projects}
			today={today}
		>
			{project => (
				<ProjectViewContext value={project.id}>
					<TaskView
						composer={{ defaultProject: project, source: 'project_view' }}
						emptyNote="No tasks in this project yet."
						filter={{ projectId: project.id }}
						name={project.name}
						ownerListKey={orpcQuery.projects.list.key()}
						today={today}
					/>
				</ProjectViewContext>
			)}
		</TaskViewScreen>
	)
}
