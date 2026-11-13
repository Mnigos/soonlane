import type { Label } from '@soonlane/contracts'
import {
	Combobox,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from '@soonlane/ui/components/combobox'
import { useQuery } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { type Dispatch, type Ref, type SetStateAction, useState } from 'react'
import { orpcQuery } from '../../../../rpc-query.client'
import type { useCreateLabelMutation } from '../../../labels/hooks/use-create-label-mutation'
import {
	LABEL_ROW_CLASS,
	PICKER_FIELD_CLASS,
	PICKER_FIELD_ROW_CLASS,
} from '../../helpers/composer-chip.constants'
import { NEW_ITEM_ID, searchByName } from '../../helpers/name-search.helper'
import { LabelListNotes, LabelOption } from './label-options'
import { CreateOption } from './picker-options'

interface LabelPickerProps {
	value: Label[]
	onChange: Dispatch<SetStateAction<Label[]>>
	createLabel: ReturnType<typeof useCreateLabelMutation>
	inputRef: Ref<HTMLInputElement>
}

/** The Labels chip's popover: a search field over the owner's labels to tick, and a row creating a new one. */
export function LabelPicker({
	value,
	onChange,
	createLabel,
	inputRef,
}: Readonly<LabelPickerProps>) {
	const [query, setQuery] = useState('')
	const { data, isError } = useQuery(orpcQuery.labels.list.queryOptions())
	const labels = data?.labels ?? []
	const { name, items } = searchByName(labels, query)

	return (
		<Combobox
			autoHighlight
			filter={null}
			inline
			inputValue={query}
			isItemEqualToValue={(item, selected) => item.id === selected.id}
			itemToStringLabel={label => label.name}
			items={items}
			multiple
			onInputValueChange={nextQuery => {
				setQuery(nextQuery)
				if (createLabel.isError) createLabel.reset()
			}}
			onValueChange={(nextLabels, details) => {
				if (!nextLabels.some(label => label.id === NEW_ITEM_ID)) {
					onChange(nextLabels)
					return
				}

				// Keeps the placeholder row out of the value; the created label is added on success.
				details.cancel()
				createLabel.mutate(
					{ name },
					{
						onSuccess: ({ label }) => {
							onChange(picked =>
								picked.some(({ id }) => id === label.id)
									? picked
									: [...picked, label]
							)
							setQuery('')
						},
					}
				)
			}}
			open
			value={value}
		>
			<div className={PICKER_FIELD_ROW_CLASS}>
				<ComboboxInput
					aria-label="Type a label"
					className={PICKER_FIELD_CLASS}
					placeholder="Type a label"
					ref={inputRef}
				/>
			</div>

			<ComboboxList className="max-h-72 overflow-y-auto py-1 empty:hidden">
				{(label: Label) =>
					label.id === NEW_ITEM_ID ? (
						<ComboboxItem
							className={LABEL_ROW_CLASS}
							disabled={createLabel.isPending}
							key={NEW_ITEM_ID}
							value={label}
						>
							<CreateOption name={label.name} noun="label" />
						</ComboboxItem>
					) : (
						<ComboboxItem
							className={LABEL_ROW_CLASS}
							key={label.id}
							value={label}
						>
							<LabelOption label={label} />

							<span className="ml-auto flex size-4 shrink-0 items-center justify-center rounded-sm border border-border-strong group-data-selected:border-primary group-data-selected:bg-primary">
								<Check
									aria-hidden
									className="size-3 text-primary-foreground opacity-0 group-data-selected:opacity-100"
									strokeWidth={3}
								/>
							</span>
						</ComboboxItem>
					)
				}
			</ComboboxList>

			<LabelListNotes
				createLabel={createLabel}
				isEmpty={data !== undefined && labels.length === 0 && name === ''}
				isLoadError={isError}
			/>
		</Combobox>
	)
}
