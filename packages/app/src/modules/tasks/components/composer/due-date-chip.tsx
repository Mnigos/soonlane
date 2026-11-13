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
import { getHostPorts } from '../../../../host-ports.client'
import { COMPOSER_CHIP_CLASS } from '../../helpers/composer-chip.constants'
import { DUE_TONE_CLASSES } from '../../helpers/due-tone.constants'
import { getNoDateHint } from '../../helpers/task-edit.helper'
import { RepeatIcon } from './date-picker-icons'
import { DueCalendarIcon } from './due-calendar-icon'
import { DueDatePicker } from './due-date-picker'
import { DueTimeField } from './due-time-field'
import { DurationMenu } from './duration-menu'
import { RepeatMenu } from './repeat-menu'

interface DueDateChipProps {
	dueDate: CalendarDate | undefined
	dueTime: string | undefined
	durationMinutes: number | undefined
	repeat: RepeatRule | undefined
	today: CalendarDate
	onDateChange: (date: CalendarDate) => void
	/** Clears the date with its time and repeat rule. */
	onNoDate: () => void
	onTimeChange: (time: string | undefined) => void
	onDurationChange: (minutes: number | undefined) => void
	onRepeatChange: (repeat: RepeatInput | undefined) => void
	onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void
}

/**
 * The task's due date and time, colored like the due line; it opens the date
 * picker, which also offers No date. Time and repeat need a date, so an
 * undated task's picker leaves them out.
 */
export function DueDateChip({
	dueDate,
	dueTime,
	durationMinutes,
	repeat,
	today,
	onDateChange,
	onNoDate,
	onTimeChange,
	onDurationChange,
	onRepeatChange,
	onKeyDown,
}: Readonly<DueDateChipProps>) {
	const { capture } = getHostPorts()
	const [isOpen, setIsOpen] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)
	const label = dueDate
		? getDueChipLabel(dueDate, { dueTime, durationMinutes }, today)
		: { text: 'No date', tone: 'later' as const }
	const repeatText = repeat && formatRepeatRule(repeat, 'long')

	return (
		<Popover onOpenChange={setIsOpen} open={isOpen}>
			<PopoverTrigger
				aria-label={
					dueDate
						? [`Due ${label.spokenText ?? label.text}`, repeatText]
								.filter(Boolean)
								.join(', ')
						: 'No due date'
				}
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
					noDateHint={getNoDateHint(dueTime, repeat !== undefined)}
					onDateChange={(date, choice) => {
						capture('date_picker_used', {
							choice,
							hasTime: dueTime !== undefined,
						})
						onDateChange(date)
						setIsOpen(false)
					}}
					onNoDate={() => {
						capture('date_picker_used', {
							choice: 'no_date',
							hasTime: dueTime !== undefined,
						})
						onNoDate()
						setIsOpen(false)
					}}
					today={today}
				>
					{dueDate && (
						<>
							<DueTimeField onChange={onTimeChange} value={dueTime} />

							{dueTime && (
								<DurationMenu
									onChange={onDurationChange}
									value={durationMinutes}
								/>
							)}

							<RepeatMenu
								dueDate={dueDate}
								onChange={rule => {
									onRepeatChange(rule)
									setIsOpen(false)
								}}
								value={repeat}
							/>
						</>
					)}
				</DueDatePicker>
			</PopoverContent>
		</Popover>
	)
}
