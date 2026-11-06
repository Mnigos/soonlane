import type { CalendarDate } from '@soonlane/domain'
import { cn } from '@soonlane/ui/cn'
import { CalendarDays } from 'lucide-react'
import {
	type KeyboardEvent,
	type PropsWithChildren,
	type Ref,
	useId,
	useState,
} from 'react'
import { formatWeekdayDayMonth } from '../../../domain/calendar-date.helper'
import { parseDueDateText } from '../../../domain/due-date-text.helper'
import {
	formatDueDate,
	getDueChipLabel,
} from '../../../domain/due-label.helper'
import { isInCalendar } from '../../../domain/month-calendar.helper'
import {
	PICKER_FIELD_CLASS,
	PICKER_FIELD_ROW_CLASS,
	PICKER_NOTE_CLASS,
} from '../../helpers/composer-chip.constants'
import { DUE_TONE_CLASSES } from '../../helpers/due-tone.constants'
import { DueDateShortcuts } from './due-date-shortcuts'
import { MonthCalendar } from './month-calendar'

interface DueDatePickerProps extends PropsWithChildren {
	dueDate?: CalendarDate
	today: CalendarDate
	onDateChange: (date: CalendarDate) => void
	inputRef: Ref<HTMLInputElement>
}

/** A text field, quick dates, a month calendar and an optional fixed footer (children). */
export function DueDatePicker({
	dueDate,
	today,
	onDateChange,
	inputRef,
	children,
}: Readonly<DueDatePickerProps>) {
	const shownDate = dueDate ? formatDueDate(dueDate, today) : ''
	const [text, setText] = useState(shownDate)
	const matchId = useId()
	const isEdited = text.trim() !== '' && text !== shownDate
	const parsed = isEdited ? parseDueDateText(text, today) : undefined
	const match = parsed && isInCalendar(parsed, today) ? parsed : undefined

	function applyOnEnter(event: KeyboardEvent<HTMLInputElement>) {
		if (event.key !== 'Enter') return

		event.preventDefault()
		if (match) onDateChange(match)
	}

	return (
		<div className="flex min-h-0 flex-col">
			<div className={PICKER_FIELD_ROW_CLASS}>
				<input
					aria-describedby={isEdited ? matchId : undefined}
					aria-invalid={isEdited && !match}
					aria-label="Due date"
					className={PICKER_FIELD_CLASS}
					onChange={event => setText(event.target.value)}
					onFocus={event => event.currentTarget.select()}
					onKeyDown={applyOnEnter}
					placeholder="Type a due date"
					ref={inputRef}
					value={text}
				/>
			</div>

			{isEdited && (
				<div className="shrink-0 border-b py-1" id={matchId}>
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
						<p className={PICKER_NOTE_CLASS}>No date found</p>
					)}
				</div>
			)}

			{/* Only the dates scroll on a short screen, so the text field and footer stay in view. */}
			<div className="min-h-0 overflow-y-auto overscroll-contain">
				<DueDateShortcuts
					onSelect={onDateChange}
					selected={dueDate}
					today={today}
				/>

				<MonthCalendar
					onSelect={onDateChange}
					selected={dueDate}
					today={today}
				/>
			</div>

			{children && (
				<div className="flex shrink-0 flex-col gap-3 border-t p-3">
					{children}
				</div>
			)}
		</div>
	)
}
