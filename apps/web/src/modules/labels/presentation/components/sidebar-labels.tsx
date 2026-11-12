import { orpcQuery } from '@soonlane/app/rpc-query'
import { Button } from '@soonlane/ui/components/button'
import { SidebarSection } from '@soonlane/ui/components/sidebar'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useCreateLabelMutation } from '../hooks/use-create-label-mutation'
import { LabelNameField } from './label-name-field'
import { SidebarLabelRow } from './sidebar-label-row'

interface SidebarLabelsProps {
	activeLabelName?: string
	onNavigate: () => void
}

const NOTE_CLASS = 'px-2 py-1.5 text-label text-faint-foreground'

/** The sidebar's Labels section; the shell keeps it mounted, so its open state survives the switch to the rail. */
export function SidebarLabels({
	activeLabelName,
	onNavigate,
}: Readonly<SidebarLabelsProps>) {
	const [isOpen, setIsOpen] = useState(true)
	const [isAdding, setIsAdding] = useState(false)
	const { data, isError } = useQuery(orpcQuery.labels.list.queryOptions())
	const createLabel = useCreateLabelMutation()

	function stopAdding() {
		setIsAdding(false)
		createLabel.reset()
	}

	return (
		<SidebarSection
			action={
				<Button
					aria-label="Add label"
					onClick={() => {
						setIsOpen(true)
						setIsAdding(true)
					}}
					size="icon"
					title="Add label"
					variant="ghost"
				>
					<Plus />
				</Button>
			}
			isOpen={isOpen}
			label="Labels"
			onOpenChange={setIsOpen}
		>
			{data?.labels.length === 0 && <p className={NOTE_CLASS}>No labels yet</p>}

			{isError && <p className={NOTE_CLASS}>Could not load your labels.</p>}

			{data && data.labels.length > 0 && (
				<ul className="flex flex-col gap-0.5">
					{data.labels.map(label => (
						<SidebarLabelRow
							activeLabelName={activeLabelName}
							key={label.id}
							label={label}
							onNavigate={onNavigate}
						/>
					))}
				</ul>
			)}

			{isAdding && (
				<LabelNameField
					label="Label name"
					mutation={createLabel}
					onCancel={stopAdding}
					onSave={(name, onSettled) =>
						createLabel.mutate({ name }, { onSuccess: stopAdding, onSettled })
					}
				/>
			)}
		</SidebarSection>
	)
}
