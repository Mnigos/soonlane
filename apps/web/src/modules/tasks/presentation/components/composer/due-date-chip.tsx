import type { CalendarDate } from '@soonlane/domain'
import { cn } from '@soonlane/ui/cn'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@soonlane/ui/components/popover'
import { Calendar } from 'lucide-react'
import { type KeyboardEvent, useRef, useState } from 'react'
import { getDueChipLabel } from '../../../domain/due-label.helper'
import { COMPOSER_CHIP_CLASS } from '../../helpers/composer-chip.constants'
import { DUE_TONE_CLASSES } from '../../helpers/due-tone.constants'
import { DueDatePicker } from './due-date-picker'

interface DueDateChipProps {
	dueDate: CalendarDate
	dueTime: string | undefined
	today: CalendarDate
	onDateChange: (date: CalendarDate) => void
	onTimeChange: (time: string | undefined) => void
	onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void
}

/**
 * The due date and time of the new task, colored like the due line; it opens
 * the date picker. A task always has a due date in this version, so the chip
 * has no clear button.
 */
export function DueDateChip({
	dueDate,
	dueTime,
	today,
	onDateChange,
	onTimeChange,
	onKeyDown,
}: Readonly<DueDateChipProps>) {
	const [isOpen, setIsOpen] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)
	const label = getDueChipLabel(dueDate, dueTime, today)

	return (
		<Popover onOpenChange={setIsOpen} open={isOpen}>
			<PopoverTrigger
				aria-label={`Due ${label.text}`}
				className={cn(COMPOSER_CHIP_CLASS, DUE_TONE_CLASSES[label.tone])}
				onKeyDown={onKeyDown}
			>
				<Calendar aria-hidden />

				{label.text}
			</PopoverTrigger>

			<PopoverContent
				aria-label="Due date"
				className="w-64"
				initialFocus={inputRef}
			>
				<DueDatePicker
					dueDate={dueDate}
					dueTime={dueTime}
					inputRef={inputRef}
					onDateChange={date => {
						onDateChange(date)
						setIsOpen(false)
					}}
					onTimeChange={onTimeChange}
					today={today}
				/>
			</PopoverContent>
		</Popover>
	)
}
