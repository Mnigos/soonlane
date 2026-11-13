import {
	DURATION_MINUTES_MAX,
	DURATION_MINUTES_MIN,
	isDurationInRange,
} from '@soonlane/domain'
import { cn } from '@soonlane/ui/cn'
import { Button } from '@soonlane/ui/components/button'
import {
	Menu,
	MenuContent,
	MenuRadioGroup,
	MenuRadioItem,
	MenuTrigger,
} from '@soonlane/ui/components/menu'
import { Hourglass, X } from 'lucide-react'
import { type KeyboardEvent, useId, useState } from 'react'
import {
	FOOTER_BUTTON_CLASS,
	FOOTER_FIELD_CLASS,
} from '../../helpers/composer-chip.constants'

interface DurationMenuProps {
	value: number | undefined
	onChange: (minutes: number | undefined) => void
}

const PRESETS = [
	{ minutes: 15, label: '15 min' },
	{ minutes: 30, label: '30 min' },
	{ minutes: 45, label: '45 min' },
	{ minutes: 60, label: '1 h' },
	{ minutes: 90, label: '1.5 h' },
	{ minutes: 120, label: '2 h' },
] as const
const NONE = 'none'
const CUSTOM = 'custom'
const MINUTES_PER_HOUR = 60

/** "20 min", "3 h", "1 h 40 min"; a preset keeps its own label ("1.5 h"). */
function formatDuration(minutes: number) {
	const hours = Math.floor(minutes / MINUTES_PER_HOUR)
	const rest = minutes % MINUTES_PER_HOUR

	return (
		PRESETS.find(preset => preset.minutes === minutes)?.label ??
		[hours > 0 && `${hours} h`, rest > 0 && `${rest} min`]
			.filter(Boolean)
			.join(' ')
	)
}

function focusElement(input: HTMLInputElement | null) {
	input?.focus()
}

/** A timed task's length: presets, Custom (a number of minutes applied on Enter or blur) and a clear button once one is set. */
export function DurationMenu({ value, onChange }: Readonly<DurationMenuProps>) {
	const [typed, setTyped] = useState<string>()
	const [isCustomPicked, setIsCustomPicked] = useState(false)
	const noteId = useId()
	const minutes = Number(typed)
	const isValid = Boolean(typed) && isDurationInRange(minutes)
	const isOutOfRange = Boolean(typed) && !isValid

	function apply() {
		if (isValid) onChange(minutes)
		if (!isOutOfRange) setTyped(undefined)
	}

	function applyOnEnter(event: KeyboardEvent<HTMLInputElement>) {
		if (event.key !== 'Enter') return

		event.preventDefault()
		apply()
	}

	if (typed !== undefined)
		return (
			<div className="flex flex-col gap-1">
				<div className="flex items-center gap-2 text-label text-secondary-foreground">
					<input
						aria-describedby={isOutOfRange ? noteId : undefined}
						aria-invalid={isOutOfRange}
						aria-label="Duration in minutes"
						className={cn(FOOTER_FIELD_CLASS, 'min-w-0 flex-1')}
						enterKeyHint="done"
						max={DURATION_MINUTES_MAX}
						min={DURATION_MINUTES_MIN}
						onBlur={apply}
						onChange={event => setTyped(event.target.value)}
						onKeyDown={applyOnEnter}
						placeholder={`${DURATION_MINUTES_MIN}-${DURATION_MINUTES_MAX}`}
						ref={focusElement}
						step={1}
						type="number"
						value={typed}
					/>
					min
				</div>

				{isOutOfRange && (
					<p className="text-caption text-faint-foreground" id={noteId}>
						{`Enter ${DURATION_MINUTES_MIN} to ${DURATION_MINUTES_MAX} minutes`}
					</p>
				)}
			</div>
		)

	return (
		<div className="flex gap-1">
			<Menu
				onOpenChangeComplete={isOpen => {
					if (isOpen || !isCustomPicked) return

					setIsCustomPicked(false)
					setTyped(value === undefined ? '' : String(value))
				}}
			>
				<MenuTrigger
					aria-label={
						value === undefined
							? undefined
							: `Duration ${formatDuration(value)}`
					}
					className={cn(
						FOOTER_BUTTON_CLASS,
						'min-w-0 px-2',
						value !== undefined && 'text-foreground'
					)}
				>
					<Hourglass aria-hidden strokeWidth={1.5} />

					{value === undefined ? 'Duration' : formatDuration(value)}
				</MenuTrigger>

				{/* Custom returns no focus: its field replaces the trigger, and Base UI's fallback (the date chip) would blur the field and close it. */}
				<MenuContent
					aria-label="Duration"
					finalFocus={!isCustomPicked}
					side="top"
				>
					<MenuRadioGroup
						onValueChange={(choice: number | typeof NONE | typeof CUSTOM) => {
							if (choice === CUSTOM) setIsCustomPicked(true)
							else onChange(choice === NONE ? undefined : choice)
						}}
						value={value ?? NONE}
					>
						<MenuRadioItem value={NONE}>No duration</MenuRadioItem>

						{PRESETS.map(preset => (
							<MenuRadioItem key={preset.minutes} value={preset.minutes}>
								{preset.label}
							</MenuRadioItem>
						))}

						<MenuRadioItem value={CUSTOM}>Custom</MenuRadioItem>
					</MenuRadioGroup>
				</MenuContent>
			</Menu>

			{value !== undefined && (
				<Button
					aria-label="Clear duration"
					className="shrink-0"
					onClick={() => onChange(undefined)}
					size="icon"
					variant="ghost"
				>
					<X aria-hidden />
				</Button>
			)}
		</div>
	)
}
