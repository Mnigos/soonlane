import type { Label } from '@soonlane/contracts'
import { cn } from '@soonlane/ui/cn'
import { Tag } from 'lucide-react'
import { LABEL_COLOR_CLASSES } from '../../../labels/helpers/label-color.constants'
import type { useCreateLabelMutation } from '../../../labels/hooks/use-create-label-mutation'
import { CHIP_ICON_STROKE } from '../../helpers/composer-chip.constants'
import { PickerNotes } from './picker-options'

interface LabelListNotesProps {
	isEmpty: boolean
	isLoadError: boolean
	createLabel: ReturnType<typeof useCreateLabelMutation>
}

/** A label row's content: the tag in the label's color and its name. */
export function LabelOption({ label }: Readonly<{ label: Label }>) {
	return (
		<>
			<Tag
				aria-hidden
				className={cn(
					'size-4 shrink-0',
					LABEL_COLOR_CLASSES[label.color ?? 'charcoal']
				)}
				strokeWidth={CHIP_ICON_STROKE}
			/>

			<span className="ph-mask truncate">{label.name}</span>
		</>
	)
}

/** The lines under a list of labels: none yet, a failed load, a failed create. */
export function LabelListNotes({
	isEmpty,
	isLoadError,
	createLabel,
}: Readonly<LabelListNotesProps>) {
	return (
		<PickerNotes
			createError={createLabel.error}
			createErrorText="Could not create the label. Try again."
			emptyText="No labels yet"
			isEmpty={isEmpty}
			isLoadError={isLoadError}
			loadErrorText="Could not load your labels."
		/>
	)
}
