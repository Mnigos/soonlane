import {
	addDays,
	formatDayMonth,
	formatWeekday,
	isBefore,
} from './calendar-date.helper'
import type { CalendarDate } from './calendar-date.schema'
import { formatDueDate, getRelativeDayName } from './day-label.helper'
import { formatDueTime } from './due-time.helper'

/** Todoist's due colors: overdue red, today green, tomorrow orange, the next 2 to 7 days violet, later uncolored. */
export type DueTone = 'overdue' | 'today' | 'tomorrow' | 'week' | 'later'

export interface DueLabel {
	text: string
	tone: DueTone
	/** What a screen reader says instead of `text` for a range: "14:00 to 15:30". */
	spokenText?: string
}

/** The time fields of a task the labels show. */
interface DueTimes {
	dueTime?: string
	durationMinutes?: number
}

const WEEK_DAYS = 7

function getDueTone(dueDate: CalendarDate, today: CalendarDate): DueTone {
	if (isBefore(dueDate, today)) return 'overdue'
	if (dueDate === today) return 'today'
	if (dueDate === addDays(today, 1)) return 'tomorrow'
	if (!isBefore(addDays(today, WEEK_DAYS), dueDate)) return 'week'

	return 'later'
}

function toDueLabel(
	day: string | undefined,
	{ dueTime, durationMinutes }: DueTimes,
	tone: DueTone
): DueLabel {
	const withDay = (time: string | undefined) =>
		[day, time].filter(Boolean).join(' ')

	return {
		text: withDay(dueTime && formatDueTime(dueTime, durationMinutes)),
		tone,
		spokenText:
			dueTime && durationMinutes !== undefined
				? withDay(formatDueTime(dueTime, durationMinutes, 'long'))
				: undefined,
	}
}

/**
 * The meta row under a task in a day list. The day heading already names the
 * date, so a task on time shows only its due time or range (or nothing); an
 * overdue task shows its date, e.g. "5 Nov" or "5 Nov 11:30–12:00".
 */
export function getDueLabel(
	dueDate: CalendarDate,
	times: DueTimes,
	today: CalendarDate
): DueLabel | undefined {
	const tone = getDueTone(dueDate, today)

	if (tone === 'overdue')
		return toDueLabel(formatDayMonth(dueDate), times, tone)
	if (!times.dueTime) return undefined

	return toDueLabel(undefined, times, tone)
}

function getDueDateName(dueDate: CalendarDate, today: CalendarDate) {
	const relative = getRelativeDayName(dueDate, today)
	if (relative) return relative
	// A weekday name is unambiguous only within the next six days.
	if (!isBefore(dueDate, today) && isBefore(dueDate, addDays(today, WEEK_DAYS)))
		return formatWeekday(dueDate, 'long')

	return formatDueDate(dueDate, today)
}

/** A due date named without a day heading (the composer's date chip, search results), e.g. "Today", "Monday", "14 Nov" or "Tomorrow 11:30". */
export function getDueChipLabel(
	dueDate: CalendarDate,
	times: DueTimes,
	today: CalendarDate
): DueLabel {
	return toDueLabel(
		getDueDateName(dueDate, today),
		times,
		getDueTone(dueDate, today)
	)
}
