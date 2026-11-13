import { cn } from '@soonlane/ui/cn'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@soonlane/ui/components/popover'
import { X } from 'lucide-react'
import {
	type KeyboardEvent,
	type PropsWithChildren,
	type ReactNode,
	type RefObject,
	useId,
	useRef,
} from 'react'
import {
	CHIP_ICON_STROKE,
	COMPOSER_CHIP_CLASS,
} from '../../helpers/composer-chip.constants'

interface PickerChipProps extends PropsWithChildren {
	/** The empty chip's text, and the accessible name of the trigger and the popover. */
	label: string
	icon: ReactNode
	name: string | undefined
	/** How many more items are picked, shown as "+N" after the name. */
	moreCount?: number
	clearLabel: string
	onClear: () => void
	open?: boolean
	onOpenChange: (open: boolean) => void
	inputRef: RefObject<HTMLInputElement | null>
	onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void
}

/** A composer chip opening a picker; the × sits beside the trigger, so the trigger stays mounted to take focus back. The masked name is the accessible name. */
export function PickerChip({
	label,
	icon,
	name,
	moreCount = 0,
	clearLabel,
	onClear,
	open,
	onOpenChange,
	inputRef,
	onKeyDown,
	children,
}: Readonly<PickerChipProps>) {
	const triggerRef = useRef<HTMLButtonElement>(null)
	const triggerId = useId()
	const nameId = useId()
	const countId = useId()

	return (
		<span className="inline-flex h-7 max-w-full min-w-0 items-center rounded-md border">
			<Popover onOpenChange={onOpenChange} open={open}>
				<PopoverTrigger
					aria-label={label}
					aria-labelledby={name && `${triggerId} ${nameId} ${countId}`}
					className={cn(
						COMPOSER_CHIP_CLASS,
						'h-full min-w-0 border-0',
						name && 'pr-1'
					)}
					id={triggerId}
					onKeyDown={onKeyDown}
					ref={triggerRef}
				>
					{icon}

					{name ? (
						<>
							<span className="ph-mask min-w-0 truncate" id={nameId}>
								{name}
							</span>

							{moreCount > 0 && <span id={countId}>+{moreCount}</span>}
						</>
					) : (
						label
					)}
				</PopoverTrigger>

				<PopoverContent
					align="center"
					aria-label={label}
					className="w-62"
					initialFocus={inputRef}
				>
					{children}
				</PopoverContent>
			</Popover>

			{name && (
				<button
					aria-label={clearLabel}
					className="mr-0.5 flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-sm text-secondary-foreground transition-colors hover:bg-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
					onClick={() => {
						onClear()
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
