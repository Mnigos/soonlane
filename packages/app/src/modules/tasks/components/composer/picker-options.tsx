import { type AnyORPCError, isDefinedError } from '@orpc/client'
import { Check, Plus } from 'lucide-react'
import {
	CHIP_ICON_STROKE,
	PICKER_NOTE_CLASS,
} from '../../helpers/composer-chip.constants'

interface CreateOptionProps {
	noun: 'label' | 'project'
	name: string
}

interface PickerNotesProps {
	isEmpty: boolean
	isLoadError: boolean
	createError: AnyORPCError | Error | null
	emptyText: string
	loadErrorText: string
	createErrorText: string
}

/** A picker's row creating a new label or project with the typed name. */
export function CreateOption({ noun, name }: Readonly<CreateOptionProps>) {
	return (
		<>
			<Plus
				aria-hidden
				className="size-4 shrink-0 text-secondary-foreground"
				strokeWidth={CHIP_ICON_STROKE}
			/>

			<span className="truncate">
				Create {noun} &quot;<span className="ph-mask">{name}</span>
				&quot;
			</span>
		</>
	)
}

/** A picker row's checkbox on the right; it follows the row's selected state. */
export function PickerCheckbox() {
	return (
		<span className="ml-auto flex size-4 shrink-0 items-center justify-center rounded-sm border border-border-strong group-data-selected:border-primary group-data-selected:bg-primary">
			<Check
				aria-hidden
				className="size-3 text-primary-foreground opacity-0 group-data-selected:opacity-100"
				strokeWidth={3}
			/>
		</span>
	)
}

/** The lines under a picker's list: none yet, a failed load, a failed create (a taken name says so). */
export function PickerNotes({
	isEmpty,
	isLoadError,
	createError,
	emptyText,
	loadErrorText,
	createErrorText,
}: Readonly<PickerNotesProps>) {
	return (
		<>
			{isEmpty && <p className={PICKER_NOTE_CLASS}>{emptyText}</p>}

			{isLoadError && <p className={PICKER_NOTE_CLASS}>{loadErrorText}</p>}

			{createError && (
				<p className="px-3 py-2 text-caption text-danger" role="alert">
					{isDefinedError(createError) && createError.code === 'CONFLICT'
						? createError.message
						: createErrorText}
				</p>
			)}
		</>
	)
}
