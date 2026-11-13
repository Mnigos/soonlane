import type { Project } from '@soonlane/contracts'
import { cn } from '@soonlane/ui/cn'
import {
	Combobox,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from '@soonlane/ui/components/combobox'
import { useQuery } from '@tanstack/react-query'
import { Ban, Check, Hash } from 'lucide-react'
import { type Ref, useState } from 'react'
import { orpcQuery } from '../../../../rpc-query.client'
import type { useCreateProjectMutation } from '../../../projects/hooks/use-create-project-mutation'
import {
	CHIP_ICON_STROKE,
	LABEL_ROW_CLASS,
	PICKER_FIELD_CLASS,
	PICKER_FIELD_ROW_CLASS,
} from '../../helpers/composer-chip.constants'
import { NEW_ITEM_ID, searchByName } from '../../helpers/name-search.helper'
import { CreateOption, PickerNotes } from './picker-options'

interface ProjectPickerProps {
	value: Project | undefined
	onChange: (project: Project | undefined) => void
	createProject: ReturnType<typeof useCreateProjectMutation>
	inputRef: Ref<HTMLInputElement>
}

const NO_PROJECT = { id: 'none', name: 'No project' }
const ROW_ICON_CLASS = 'size-4 shrink-0 text-muted-foreground'

/** The Project chip's popover: a search field over "No project" and the owner's projects to pick one, and a row creating a new one. */
export function ProjectPicker({
	value,
	onChange,
	createProject,
	inputRef,
}: Readonly<ProjectPickerProps>) {
	const [query, setQuery] = useState('')
	const { data, isError } = useQuery(orpcQuery.projects.list.queryOptions())
	const projects = data?.projects ?? []
	const { name, items } = searchByName(projects, query)

	return (
		<Combobox
			autoHighlight
			filter={null}
			inline
			inputValue={query}
			isItemEqualToValue={(item, selected) => item.id === selected.id}
			itemToStringLabel={item => item.name}
			// Only while nothing is typed, so Enter picks the first match.
			items={name === '' ? [NO_PROJECT, ...items] : items}
			onInputValueChange={nextQuery => {
				setQuery(nextQuery)
				if (createProject.isError) createProject.reset()
			}}
			onValueChange={(item, details) => {
				if (item?.id !== NEW_ITEM_ID) {
					onChange(projects.find(({ id }) => id === item?.id))
					return
				}

				details.cancel()
				createProject.mutate(
					{ name },
					{ onSuccess: ({ project }) => onChange(project) }
				)
			}}
			open
			value={value ?? NO_PROJECT}
		>
			<div className={PICKER_FIELD_ROW_CLASS}>
				<ComboboxInput
					aria-label="Type a project"
					className={PICKER_FIELD_CLASS}
					placeholder="Type a project"
					ref={inputRef}
				/>
			</div>

			<ComboboxList className="max-h-72 overflow-y-auto py-1 empty:hidden">
				{(item: typeof NO_PROJECT) => (
					<ComboboxItem
						className={LABEL_ROW_CLASS}
						disabled={item.id === NEW_ITEM_ID && createProject.isPending}
						key={item.id}
						value={item}
					>
						{item.id === NEW_ITEM_ID ? (
							<CreateOption name={item.name} noun="project" />
						) : (
							<>
								{item.id === NO_PROJECT.id ? (
									<Ban
										aria-hidden
										className={ROW_ICON_CLASS}
										strokeWidth={CHIP_ICON_STROKE}
									/>
								) : (
									<Hash
										aria-hidden
										className={ROW_ICON_CLASS}
										strokeWidth={CHIP_ICON_STROKE}
									/>
								)}

								<span
									className={cn(
										'truncate',
										item.id !== NO_PROJECT.id && 'ph-mask'
									)}
								>
									{item.name}
								</span>

								<Check
									aria-hidden
									className="ml-auto size-4 shrink-0 text-primary opacity-0 group-data-selected:opacity-100"
									strokeWidth={2}
								/>
							</>
						)}
					</ComboboxItem>
				)}
			</ComboboxList>

			<PickerNotes
				createError={createProject.error}
				createErrorText="Could not create the project. Try again."
				emptyText="No projects yet"
				isEmpty={data !== undefined && projects.length === 0 && name === ''}
				isLoadError={isError}
				loadErrorText="Could not load your projects."
			/>
		</Combobox>
	)
}
