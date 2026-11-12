import { useQuery } from '@tanstack/react-query'
import { orpcQuery } from '../../../rpc-query.client'
import { SidebarListSection } from '../../shell/components/sidebar-list-section'
import { LABEL_NAME_FIELD } from '../helpers/label-sidebar.constants'
import { useCreateLabelMutation } from '../hooks/use-create-label-mutation'
import { SidebarLabelRow } from './sidebar-label-row'

interface SidebarLabelsProps {
	activeLabelName?: string
	onNavigate: () => void
}

export function SidebarLabels({
	activeLabelName,
	onNavigate,
}: Readonly<SidebarLabelsProps>) {
	const { data, isError } = useQuery(orpcQuery.labels.list.queryOptions())
	const createLabel = useCreateLabelMutation()

	return (
		<SidebarListSection
			addLabel="Add label"
			emptyNote="No labels yet"
			heading="Labels"
			isError={isError}
			items={data?.labels}
			loadError="Could not load your labels."
			mutation={createLabel}
			nameField={LABEL_NAME_FIELD}
			newNameLabel="Label name"
			onCreate={(name, callbacks) => createLabel.mutate({ name }, callbacks)}
		>
			{label => (
				<SidebarLabelRow
					activeLabelName={activeLabelName}
					key={label.id}
					label={label}
					onNavigate={onNavigate}
				/>
			)}
		</SidebarListSection>
	)
}
