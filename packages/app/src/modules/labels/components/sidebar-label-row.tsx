import type { ListedLabel } from '@soonlane/contracts'
import { APP_PATHS } from '../../../app-path.constants'
import { SidebarListRow } from '../../shell/components/sidebar-list-row'
import { LABEL_COLOR_CLASSES } from '../helpers/label-color.constants'
import { LABEL_NAME_FIELD } from '../helpers/label-sidebar.constants'
import { useUpdateLabelMutation } from '../hooks/use-update-label-mutation'
import { DeleteLabelDialog } from './delete-label-dialog'
import { LabelColorSubmenu } from './label-color-submenu'

interface SidebarLabelRowProps {
	activeLabelName?: string
	label: ListedLabel
	onNavigate: () => void
}

export function SidebarLabelRow({
	activeLabelName,
	label,
	onNavigate,
}: Readonly<SidebarLabelRowProps>) {
	const updateLabel = useUpdateLabelMutation()

	return (
		<SidebarListRow
			activeName={activeLabelName}
			item={label}
			menuItems={<LabelColorSubmenu label={label} />}
			mutation={updateLabel}
			nameField={{
				...LABEL_NAME_FIELD,
				iconClassName: LABEL_COLOR_CLASSES[label.color ?? 'charcoal'],
			}}
			onNavigate={onNavigate}
			onRename={(name, callbacks) =>
				updateLabel.mutate({ id: label.id, name }, callbacks)
			}
			renderDeleteDialog={callbacks => (
				<DeleteLabelDialog label={label} {...callbacks} />
			)}
			to={APP_PATHS.label}
		/>
	)
}
