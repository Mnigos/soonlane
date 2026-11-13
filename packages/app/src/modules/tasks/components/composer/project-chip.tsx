import type { Project } from '@soonlane/contracts'
import { useQuery } from '@tanstack/react-query'
import { Hash } from 'lucide-react'
import { type KeyboardEvent, useRef, useState } from 'react'
import { orpcQuery } from '../../../../rpc-query.client'
import { useCreateProjectMutation } from '../../../projects/hooks/use-create-project-mutation'
import { CHIP_ICON_STROKE } from '../../helpers/composer-chip.constants'
import { PickerChip } from './picker-chip'
import { ProjectPicker } from './project-picker'

interface ProjectChipProps {
	value: Project | undefined
	onChange: (project: Project | undefined) => void
	onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void
}

/** "Project", or the chosen project's name; picking one closes the picker, and its × clears it. */
export function ProjectChip({
	value,
	onChange,
	onKeyDown,
}: Readonly<ProjectChipProps>) {
	const inputRef = useRef<HTMLInputElement>(null)
	const [isOpen, setIsOpen] = useState(false)
	const createProject = useCreateProjectMutation()
	const { data } = useQuery(orpcQuery.projects.list.queryOptions())
	// A rename elsewhere shows at once; a deleted project stays, so the save fails with the server's message.
	const picked =
		data?.projects.find(project => project.id === value?.id) ?? value

	return (
		<PickerChip
			clearLabel="Remove project"
			icon={<Hash aria-hidden strokeWidth={CHIP_ICON_STROKE} />}
			inputRef={inputRef}
			label="Project"
			name={picked?.name}
			onClear={() => onChange(undefined)}
			onKeyDown={onKeyDown}
			onOpenChange={open => {
				setIsOpen(open)
				if (createProject.isError) createProject.reset()
			}}
			open={isOpen}
		>
			<ProjectPicker
				createProject={createProject}
				inputRef={inputRef}
				onChange={project => {
					onChange(project)
					setIsOpen(false)
				}}
				value={value}
			/>
		</PickerChip>
	)
}
