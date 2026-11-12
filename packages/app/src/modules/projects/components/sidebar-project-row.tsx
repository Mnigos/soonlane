import type { ListedProject } from '@soonlane/contracts'
import { APP_PATHS } from '../../../app-path.constants'
import { SidebarListRow } from '../../shell/components/sidebar-list-row'
import { PROJECT_NAME_FIELD } from '../helpers/project-sidebar.constants'
import { useUpdateProjectMutation } from '../hooks/use-update-project-mutation'
import { DeleteProjectDialog } from './delete-project-dialog'

interface SidebarProjectRowProps {
	activeProjectName?: string
	project: ListedProject
	onNavigate: () => void
}

export function SidebarProjectRow({
	activeProjectName,
	project,
	onNavigate,
}: Readonly<SidebarProjectRowProps>) {
	const updateProject = useUpdateProjectMutation()

	return (
		<SidebarListRow
			activeName={activeProjectName}
			item={project}
			mutation={updateProject}
			nameField={PROJECT_NAME_FIELD}
			onNavigate={onNavigate}
			onRename={(name, callbacks) =>
				updateProject.mutate({ id: project.id, name }, callbacks)
			}
			renderDeleteDialog={callbacks => (
				<DeleteProjectDialog project={project} {...callbacks} />
			)}
			to={APP_PATHS.project}
		/>
	)
}
