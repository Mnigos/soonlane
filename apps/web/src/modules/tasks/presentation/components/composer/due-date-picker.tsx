import type { CalendarDate } from '@soonlane/domain'
import { cn } from '@soonlane/ui/cn'
import { CalendarDays } from 'lucide-react'
import { type KeyboardEvent, type Ref, useId, useState } from 'react'
import {
	formatWeekdayDayMonth,
	isBefore,
} from '../../../domain/calendar-date.helper'
import { parseDueDateText } from '../../../domain/due-date-text.helper'
import {
	formatDueDate,
	getDueChipLabel,
} from '../../../domain/due-label.helper'
import { FOOTER_BUTTON_CLASS } from '../../helpers/composer-chip.constants'
import { DUE_TONE_CLASSES } from '../../helpers/due-tone.constants'
import { ComingSoonButton } from './coming-soon-button'
import { RepeatIcon } from './date-picker-icons'
import { DueDateShortcuts } from './due-date-shortcuts'
import { DueTimeField } from './due-time-field'
import { MonthCalendar } from './month-calendar'

interface DueDatePickerProps {
	dueDate: CalendarDate
	dueTime: string | undefined
	today: CalendarDate
	onDateChange: (date: CalendarDate) => void
	onTimeChange: (time: string | undefined) => void
	inputRef: Ref<HTMLInputElement>
}

/** The date chip's popover: a text field, quick dates, a month calendar and the optional time. */
export function DueDatePicker({
	dueDate,
	dueTime,
	today,
	onDateChange,
	onTimeChange,
	inputRef,
}: Readonly<DueDatePickerProps>) {
	const shownDate = formatDueDate(dueDate, today)
	const [text, setText] = useState(shownDate)
	const matchId = useId()
	const isEdited = text.trim() !== '' && text !== shownDate
	const parsed = isEdited ? parseDueDateText(text, today) : undefined
	const match = parsed && !isBefore(parsed, today) ? parsed : undefined

	function applyOnEnter(event: KeyboardEvent<HTMLInputElement>) {
		if (event.key !== 'Enter') return

		event.preventDefault()
		if (match) onDateChange(match)
	}

	return (
		<div className="flex flex-col">
			<div className="flex h-10 items-center border-b px-3">
				<input
					aria-describedby={isEdited ? matchId : undefined}
					aria-invalid={isEdited && !match}
					aria-label="Due date"
					className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-faint-foreground"
					onChange={event => setText(event.target.value)}
					onFocus={event => event.currentTarget.select()}
					onKeyDown={applyOnEnter}
					placeholder="Type a due date"
					ref={inputRef}
					value={text}
				/>
			</div>

			{isEdited && (
				<div className="border-b py-1" id={matchId}>
					{match ? (
						<button
							className="flex h-8 w-full cursor-pointer items-center gap-2.5 px-3 text-sm text-foreground transition-colors outline-none hover:bg-hover focus-visible:bg-hover"
							onClick={() => onDateChange(match)}
							type="button"
						>
							<CalendarDays
								aria-hidden
								className={cn(
									'size-4',
									DUE_TONE_CLASSES[
										getDueChipLabel(match, undefined, today).tone
									]
								)}
							/>
							{formatWeekdayDayMonth(match)}
						</button>
					) : (
						<p className="flex h-8 items-center px-3 text-label text-faint-foreground">
							No date found
						</p>
					)}
				</div>
			)}

			<DueDateShortcuts
				onSelect={onDateChange}
				selected={dueDate}
				today={today}
			/>

			<MonthCalendar onSelect={onDateChange} selected={dueDate} today={today} />

			<div className="flex flex-col gap-3 border-t p-3">
				<DueTimeField onChange={onTimeChange} value={dueTime} />

				<ComingSoonButton className={FOOTER_BUTTON_CLASS} label="Repeat">
					<RepeatIcon strokeWidth={1.5} />
					Repeat
				</ComingSoonButton>
			</div>
		</div>
	)
}
