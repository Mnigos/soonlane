import type { CalendarDate } from '@soonlist/domain'
import { addDays, formatDayMonth, isBefore } from './calendar-date.helper'

/** Todoist's due colors: overdue red, today green, tomorrow orange, the next 2 to 7 days violet, later uncolored. */
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

/**
 * The meta row under a task in a day list. The day heading already names the
 * date, so a task on time shows only its due time (or nothing); an overdue
 * task shows its date, e.g. "5 Nov" or "5 Nov 11:30".
 */
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
