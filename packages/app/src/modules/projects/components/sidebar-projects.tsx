import { useQuery } from '@tanstack/react-query'
import { orpcQuery } from '../../../rpc-query.client'
import { SidebarListSection } from '../../shell/components/sidebar-list-section'
import { PROJECT_NAME_FIELD } from '../helpers/project-sidebar.constants'
import { useCreateProjectMutation } from '../hooks/use-create-project-mutation'
import { SidebarProjectRow } from './sidebar-project-row'

interface SidebarProjectsProps {
	activeProjectName?: string
	onNavigate: () => void
}

export function SidebarProjects({
	activeProjectName,
	onNavigate,
}: Readonly<SidebarProjectsProps>) {
	const { data, isError } = useQuery(orpcQuery.projects.list.queryOptions())
	const createProject = useCreateProjectMutation()

	return (
		<SidebarListSection
			addLabel="Add project"
			emptyNote="No projects yet"
			heading="Projects"
			isError={isError}
			items={data?.projects}
			loadError="Could not load your projects."
			mutation={createProject}
			nameField={PROJECT_NAME_FIELD}
			newNameLabel="Project name"
			onCreate={(name, callbacks) => createProject.mutate({ name }, callbacks)}
		>
			{project => (
				<SidebarProjectRow
					activeProjectName={activeProjectName}
					key={project.id}
					onNavigate={onNavigate}
					project={project}
				/>
			)}
		</SidebarListSection>
	)
}
