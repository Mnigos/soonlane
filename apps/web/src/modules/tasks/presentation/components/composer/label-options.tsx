import { isDefinedError } from '@orpc/client'
import type { Label } from '@soonlane/contracts'
import { cn } from '@soonlane/ui/cn'
import { Plus, Tag } from 'lucide-react'
import { LABEL_COLOR_CLASSES } from '@/modules/labels/presentation/helpers/label-color.constants'
import type { useCreateLabelMutation } from '@/modules/labels/presentation/hooks/use-create-label-mutation'
import {
	CHIP_ICON_STROKE,
	PICKER_NOTE_CLASS,
} from '../../helpers/composer-chip.constants'

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

export function CreateLabelOption({ name }: Readonly<{ name: string }>) {
	return (
		<>
			<Plus
				aria-hidden
				className="size-4 shrink-0 text-secondary-foreground"
				strokeWidth={CHIP_ICON_STROKE}
			/>

			<span className="truncate">
				Create label &quot;<span className="ph-mask">{name}</span>
				&quot;
			</span>
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
		<>
			{isEmpty && <p className={PICKER_NOTE_CLASS}>No labels yet</p>}

			{isLoadError && (
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
		</>
	)
}
