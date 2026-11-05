import type { CalendarDate } from '@soonlist/domain'
import { addDays, formatDayMonth, formatWeekday } from './calendar-date.helper'

const LABEL_SEPARATOR = ' · '

export function getRelativeDayName(date: CalendarDate, today: CalendarDate) {
	if (date === today) return 'Today'
	if (date === addDays(today, 1)) return 'Tomorrow'

	return undefined
}

/** Heading of a day in a task list, e.g. "5 Nov · Today · Thursday" or "7 Nov · Saturday". */
export function getDayHeading(date: CalendarDate, today: CalendarDate) {
	return [
		formatDayMonth(date),
		getRelativeDayName(date, today),
		formatWeekday(date, 'long'),
	]
		.filter(part => part !== undefined)
		.join(LABEL_SEPARATOR)
}
