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
import { LABEL_COLOR_CLASSES } from '../../../labels/helpers/label-color.constants'
import { useCreateLabelMutation } from '../../../labels/hooks/use-create-label-mutation'
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

/**
 * One chip for the chosen labels: "Labels", or the first label and "+N" for the rest.
 * It opens the label picker; its × clears every label. The × sits beside the trigger,
 * not inside it, and the trigger stays mounted so focus can return to it. The label name
 * is user content: it stays in masked text, and the accessible name points at it.
 */
export function LabelsChip({
	value,
	onChange,
	onKeyDown,
}: Readonly<LabelsChipProps>) {
	const inputRef = useRef<HTMLInputElement>(null)
	const triggerRef = useRef<HTMLButtonElement>(null)
	const triggerId = useId()
	const nameId = useId()
	const countId = useId()
	const createLabel = useCreateLabelMutation()
	const [first] = value
	const moreCount = value.length - 1

	return (
		<span className="inline-flex h-7 max-w-full min-w-0 items-center rounded-md border">
			<Popover
				onOpenChange={() => {
					if (createLabel.isError) createLabel.reset()
				}}
			>
				<PopoverTrigger
					aria-label="Labels"
					aria-labelledby={first && `${triggerId} ${nameId} ${countId}`}
					className={cn(
						COMPOSER_CHIP_CLASS,
						'h-full min-w-0 border-0',
						first && 'pr-1'
					)}
					id={triggerId}
					onKeyDown={onKeyDown}
					ref={triggerRef}
				>
					<Tag
						aria-hidden
						className={first && LABEL_COLOR_CLASSES[first.color ?? 'charcoal']}
						strokeWidth={CHIP_ICON_STROKE}
					/>

					{first ? (
						<>
							<span className="ph-mask min-w-0 truncate" id={nameId}>
								{first.name}
							</span>

							{moreCount > 0 && <span id={countId}>+{moreCount}</span>}
						</>
					) : (
						'Labels'
					)}
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

			{first && (
				<button
					aria-label="Remove labels"
					className="mr-0.5 flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-sm text-secondary-foreground transition-colors hover:bg-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
					onClick={() => {
						onChange([])
						triggerRef.current?.focus()
					}}
					onKeyDown={onKeyDown}
					type="button"
				>
					<X aria-hidden className="size-3.5" strokeWidth={CHIP_ICON_STROKE} />
				</button>
			)}
		</span>
	)
}
