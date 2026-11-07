import type { CalendarDate } from '@soonlane/domain'
import {
	addDays,
	formatDayMonth,
	formatWeekday,
	isBefore,
} from './calendar-date.helper'
import { getRelativeDayName } from './day-label.helper'

export type DueTone = 'overdue' | 'today' | 'tomorrow' | 'week' | 'later'

export interface DueLabel {
	text: string
	tone: DueTone
}

const WEEK_DAYS = 7

function getDueTone(dueDate: CalendarDate, today: CalendarDate): DueTone {
	if (isBefore(dueDate, today)) return 'overdue'
	if (dueDate === today) return 'today'
	if (dueDate === addDays(today, 1)) return 'tomorrow'
	if (!isBefore(addDays(today, WEEK_DAYS), dueDate)) return 'week'

	return 'later'
}

// The day heading already names the date, so only an overdue task shows its date.
export function getDueLabel(
	dueDate: CalendarDate,
	dueTime: string | undefined,
	today: CalendarDate
): DueLabel | undefined {
	const tone = getDueTone(dueDate, today)

	if (tone === 'overdue')
		return {
			text: [formatDayMonth(dueDate), dueTime].filter(Boolean).join(' '),
			tone,
		}
	if (!dueTime) return undefined

	return { text: dueTime, tone }
}

export function formatDueDate(dueDate: CalendarDate, today: CalendarDate) {
	const year = dueDate.slice(0, 4)

	return year === today.slice(0, 4)
		? formatDayMonth(dueDate)
		: `${formatDayMonth(dueDate)} ${year}`
}

function getDueDateName(dueDate: CalendarDate, today: CalendarDate) {
	const relative = getRelativeDayName(dueDate, today)
	if (relative) return relative
	// A weekday name is unambiguous only within the next six days.
	if (!isBefore(dueDate, today) && isBefore(dueDate, addDays(today, WEEK_DAYS)))
		return formatWeekday(dueDate, 'long')

	return formatDueDate(dueDate, today)
}

export function getDueChipLabel(
	dueDate: CalendarDate,
	dueTime: string | undefined,
	today: CalendarDate
): DueLabel {
	return {
		text: [getDueDateName(dueDate, today), dueTime].filter(Boolean).join(' '),
		tone: getDueTone(dueDate, today),
	}
}
