import type { CalendarDate } from '@soonlane/domain'
import { addDays, formatDayMonth, formatWeekday } from './calendar-date.helper'

const LABEL_SEPARATOR = ' · '

export function getRelativeDayName(date: CalendarDate, today: CalendarDate) {
	if (date === today) return 'Today'
	if (date === addDays(today, 1)) return 'Tomorrow'

	return undefined
}

export function getDayHeading(date: CalendarDate, today: CalendarDate) {
	return [
		formatDayMonth(date),
		getRelativeDayName(date, today),
		formatWeekday(date, 'long'),
	]
		.filter(part => part !== undefined)
		.join(LABEL_SEPARATOR)
}

export function getActiveDayLabel(date: CalendarDate, today: CalendarDate) {
	return (
		getRelativeDayName(date, today) ??
		`${formatWeekday(date, 'short')} ${formatDayMonth(date)}`
	)
}
