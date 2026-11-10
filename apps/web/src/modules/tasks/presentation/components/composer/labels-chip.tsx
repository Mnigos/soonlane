import type { Label } from '@soonlane/contracts'
import { cn } from '@soonlane/ui/cn'
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
	useId,
	useRef,
} from 'react'
import { LABEL_COLOR_CLASSES } from '@/modules/labels/presentation/helpers/label-color.constants'
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
	const chipId = useId()
	const createLabel = useCreateLabelMutation()

	return (
		<>
			<Popover
				onOpenChange={() => {
					if (createLabel.isError) createLabel.reset()
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
						className={cn(
							'size-4 shrink-0',
							LABEL_COLOR_CLASSES[label.color ?? 'charcoal']
						)}
						strokeWidth={CHIP_ICON_STROKE}
					/>
					<span className="ph-mask" id={`${chipId}-${label.id}-name`}>
						{label.name}
					</span>

					<button
						aria-label="Remove label"
						aria-labelledby={`${chipId}-${label.id}-remove ${chipId}-${label.id}-name`}
						className="flex size-5 cursor-pointer items-center justify-center rounded-sm transition-colors hover:bg-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
						onClick={() => {
							onChange(value.filter(({ id }) => id !== label.id))
							triggerRef.current?.focus()
						}}
						id={`${chipId}-${label.id}-remove`}
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
