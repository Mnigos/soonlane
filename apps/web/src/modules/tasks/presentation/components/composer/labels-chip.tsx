import type { Label } from '@soonlane/contracts'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@soonlane/ui/components/popover'
import { Tag, X } from 'lucide-react'
import {
	type Dispatch,
	type KeyboardEvent,
	type SetStateAction,
	useRef,
} from 'react'
import { getLabelColor } from '@/modules/labels/presentation/helpers/label-color.helper'
import { useCreateLabelMutation } from '@/modules/labels/presentation/hooks/use-create-label-mutation'
import {
	CHIP_ICON_STROKE,
	COMPOSER_CHIP_CLASS,
} from '../../helpers/composer-chip.constants'
import { LabelPicker } from './label-picker'

interface LabelsChipProps {
	value: Label[]
	onChange: Dispatch<SetStateAction<Label[]>>
	onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void
}

/** "Labels" opens the label picker; each chosen label follows as a chip with a remove button. */
export function LabelsChip({
	value,
	onChange,
	onKeyDown,
}: Readonly<LabelsChipProps>) {
	const inputRef = useRef<HTMLInputElement>(null)
	const triggerRef = useRef<HTMLButtonElement>(null)
	// Lives here, not in the picker, so a label created after the popover closes still gets ticked.
	const createLabel = useCreateLabelMutation()

	return (
		<>
			<Popover
				onOpenChange={open => {
					// Resetting a pending create would drop its success callback.
					if (!open && createLabel.isError) createLabel.reset()
				}}
			>
				<PopoverTrigger
					className={COMPOSER_CHIP_CLASS}
					onKeyDown={onKeyDown}
					ref={triggerRef}
				>
					<Tag aria-hidden strokeWidth={CHIP_ICON_STROKE} />
					Labels
				</PopoverTrigger>

				<PopoverContent
					align="center"
					aria-label="Labels"
					className="w-62"
					initialFocus={inputRef}
				>
					<LabelPicker
						createLabel={createLabel}
						inputRef={inputRef}
						onChange={onChange}
						value={value}
					/>
				</PopoverContent>
			</Popover>

			{value.map(label => (
				<span
					className="inline-flex h-7 items-center gap-1 rounded-md border pr-0.5 pl-1.5 text-label whitespace-nowrap text-secondary-foreground"
					key={label.id}
				>
					<Tag
						aria-hidden
						className="size-4 shrink-0"
						strokeWidth={CHIP_ICON_STROKE}
						style={{ color: getLabelColor(label.color) }}
					/>
					{label.name}

					<button
						aria-label={`Remove label ${label.name}`}
						className="flex size-5 cursor-pointer items-center justify-center rounded-sm transition-colors hover:bg-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
						onClick={() => {
							onChange(value.filter(({ id }) => id !== label.id))
							triggerRef.current?.focus()
						}}
						onKeyDown={onKeyDown}
						type="button"
					>
						<X
							aria-hidden
							className="size-3.5"
							strokeWidth={CHIP_ICON_STROKE}
						/>
					</button>
				</span>
			))}
		</>
	)
}
