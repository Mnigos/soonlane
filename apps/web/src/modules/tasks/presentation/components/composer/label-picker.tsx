import { isDefinedError } from '@orpc/client'
import type { Label } from '@soonlane/contracts'
import { cn } from '@soonlane/ui/cn'
import {
	Combobox,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from '@soonlane/ui/components/combobox'
import { useQuery } from '@tanstack/react-query'
import { Check, Plus, Tag } from 'lucide-react'
import { type Dispatch, type Ref, type SetStateAction, useState } from 'react'
import { LABEL_COLOR_CLASSES } from '@/modules/labels/presentation/helpers/label-color.constants'
import type { useCreateLabelMutation } from '@/modules/labels/presentation/hooks/use-create-label-mutation'
import { orpcQuery } from '@/platform/rpc/rpc-query.client'
import {
	CHIP_ICON_STROKE,
	PICKER_FIELD_CLASS,
	PICKER_FIELD_ROW_CLASS,
	PICKER_NOTE_CLASS,
} from '../../helpers/composer-chip.constants'

interface LabelPickerProps {
	value: Label[]
	onChange: Dispatch<SetStateAction<Label[]>>
	createLabel: ReturnType<typeof useCreateLabelMutation>
	inputRef: Ref<HTMLInputElement>
}

// The "Create label" row is a label with this id, so the arrow keys and Enter reach it.
const NEW_LABEL_ID = 'new'

const ROW_CLASS =
	'group flex h-8 cursor-pointer items-center gap-2.5 px-3 text-label text-foreground outline-none select-none data-disabled:opacity-50 data-highlighted:bg-hover'

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
	const name = query.trim()
	const search = name.toLowerCase()
	const matches = labels.filter(label =>
		label.name.toLowerCase().includes(search)
	)
	const isNewName =
		name !== '' && !labels.some(label => label.name.toLowerCase() === search)
	const items = isNewName ? [...matches, { id: NEW_LABEL_ID, name }] : matches

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
				if (!nextLabels.some(label => label.id === NEW_LABEL_ID)) {
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
					label.id === NEW_LABEL_ID ? (
						<ComboboxItem
							className={ROW_CLASS}
							disabled={createLabel.isPending}
							key={NEW_LABEL_ID}
							value={label}
						>
							<Plus
								aria-hidden
								className="size-4 shrink-0 text-secondary-foreground"
								strokeWidth={CHIP_ICON_STROKE}
							/>

							<span className="truncate">{`Create label "${label.name}"`}</span>
						</ComboboxItem>
					) : (
						<ComboboxItem className={ROW_CLASS} key={label.id} value={label}>
							<Tag
								aria-hidden
								className={cn(
									'size-4 shrink-0',
									LABEL_COLOR_CLASSES[label.color ?? 'charcoal']
								)}
								strokeWidth={CHIP_ICON_STROKE}
							/>

							<span className="truncate">{label.name}</span>

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

			{data && labels.length === 0 && name === '' && (
				<p className={PICKER_NOTE_CLASS}>No labels yet</p>
			)}

			{isError && (
				<p className={PICKER_NOTE_CLASS}>Could not load your labels.</p>
			)}

			{createLabel.isError && (
				<p className="px-3 py-2 text-caption text-danger" role="alert">
					{isDefinedError(createLabel.error) &&
					createLabel.error.code === 'CONFLICT'
						? createLabel.error.message
						: 'Could not create the label. Try again.'}
				</p>
			)}
		</Combobox>
	)
}
