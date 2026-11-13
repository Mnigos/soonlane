import type { Label } from '@soonlane/contracts'
import { Tag } from 'lucide-react'
import {
	type Dispatch,
	type KeyboardEvent,
	type SetStateAction,
	useRef,
} from 'react'
import { LABEL_COLOR_CLASSES } from '../../../labels/helpers/label-color.constants'
import { useCreateLabelMutation } from '../../../labels/hooks/use-create-label-mutation'
import { CHIP_ICON_STROKE } from '../../helpers/composer-chip.constants'
import { LabelPicker } from './label-picker'
import { PickerChip } from './picker-chip'

interface LabelsChipProps {
	value: Label[]
	onChange: Dispatch<SetStateAction<Label[]>>
	onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void
}

/** One chip for the chosen labels: "Labels", or the first label and "+N" for the rest; its × clears every label. */
export function LabelsChip({
	value,
	onChange,
	onKeyDown,
}: Readonly<LabelsChipProps>) {
	const inputRef = useRef<HTMLInputElement>(null)
	const createLabel = useCreateLabelMutation()
	const [first] = value

	return (
		<PickerChip
			clearLabel="Remove labels"
			icon={
				<Tag
					aria-hidden
					className={first && LABEL_COLOR_CLASSES[first.color ?? 'charcoal']}
					strokeWidth={CHIP_ICON_STROKE}
				/>
			}
			inputRef={inputRef}
			label="Labels"
			moreCount={value.length - 1}
			name={first?.name}
			onClear={() => onChange([])}
			onKeyDown={onKeyDown}
			onOpenChange={() => {
				if (createLabel.isError) createLabel.reset()
			}}
		>
			<LabelPicker
				createLabel={createLabel}
				inputRef={inputRef}
				onChange={onChange}
				value={value}
			/>
		</PickerChip>
	)
}
