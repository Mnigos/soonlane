import { capture } from '@soonlane/analytics/client'
import { COMPOSER_CHIP_CLASS } from '@soonlane/app/tasks/helpers/composer-chip.constants'
import type { RepeatInput } from '@soonlane/contracts'
import {
	type CalendarDate,
	getDueChipLabel,
	formatRepeatRule,
	type RepeatRule,
} from '@soonlane/domain'
import { cn } from '@soonlane/ui/cn'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@soonlane/ui/components/popover'
import { type KeyboardEvent, useRef, useState } from 'react'
import { DUE_TONE_CLASSES } from '../../helpers/due-tone.constants'
import { RepeatIcon } from './date-picker-icons'
import { DueCalendarIcon } from './due-calendar-icon'
import { DueDatePicker } from './due-date-picker'
import { DueTimeField } from './due-time-field'
import { RepeatMenu } from './repeat-menu'

interface DueDateChipProps {
	dueDate: CalendarDate
	dueTime: string | undefined
	repeat: RepeatRule | undefined
	today: CalendarDate
	onDateChange: (date: CalendarDate) => void
	onTimeChange: (time: string | undefined) => void
	onRepeatChange: (repeat: RepeatInput | undefined) => void
	onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void
}

/**
 * The task's due date and time, colored like the due line; it opens the date
 * picker. A task always has a due date, so the chip has no clear button.
 */
export function DueDateChip({
	dueDate,
	dueTime,
	repeat,
	today,
	onDateChange,
	onTimeChange,
	onRepeatChange,
	onKeyDown,
}: Readonly<DueDateChipProps>) {
	const [isOpen, setIsOpen] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)
	const label = getDueChipLabel(dueDate, dueTime, today)
	const repeatText = repeat && formatRepeatRule(repeat, 'long')

	return (
		<Popover onOpenChange={setIsOpen} open={isOpen}>
			<PopoverTrigger
				aria-label={[`Due ${label.text}`, repeatText]
					.filter(Boolean)
					.join(', ')}
				className={cn(COMPOSER_CHIP_CLASS, DUE_TONE_CLASSES[label.tone])}
				onKeyDown={onKeyDown}
			>
				<DueCalendarIcon />

				{label.text}

				{repeat && <RepeatIcon strokeWidth={1.5} />}
			</PopoverTrigger>

			<PopoverContent
				align="center"
				aria-label="Due date"
				className="flex w-62 flex-col"
				initialFocus={inputRef}
				side="top"
				sideOffset={2}
			>
				<DueDatePicker
					dueDate={dueDate}
					inputRef={inputRef}
					onDateChange={(date, choice) => {
						capture('date_picker_used', {
							choice,
							has_time: dueTime !== undefined,
						})
						onDateChange(date)
						setIsOpen(false)
					}}
					today={today}
				>
					<DueTimeField onChange={onTimeChange} value={dueTime} />

					<RepeatMenu
						dueDate={dueDate}
						onChange={rule => {
							onRepeatChange(rule)
							setIsOpen(false)
						}}
						value={repeat}
					/>
				</DueDatePicker>
			</PopoverContent>
		</Popover>
	)
}
