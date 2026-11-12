import { addDays, formatDayMonth, formatWeekday } from './calendar-date.helper'
import type { CalendarDate } from './calendar-date.schema'

const LABEL_SEPARATOR = ' · '

export function getRelativeDayName(date: CalendarDate, today: CalendarDate) {
	if (date === today) return 'Today'
	if (date === addDays(today, 1)) return 'Tomorrow'

	return undefined
}

/** "14 Nov", with the year when it is not this year: "6 Jan 2027". */
export function formatDueDate(dueDate: CalendarDate, today: CalendarDate) {
	const year = dueDate.slice(0, 4)

	return year === today.slice(0, 4)
		? formatDayMonth(dueDate)
		: `${formatDayMonth(dueDate)} ${year}`
}

/** Heading of a day in a task list, e.g. "5 Nov · Today · Thursday", "4 Nov · Yesterday · Wednesday" or "7 Jan 2027 · Thursday". */
export function getDayHeading(date: CalendarDate, today: CalendarDate) {
	return [
		formatDueDate(date, today),
		date === addDays(today, -1) ? 'Yesterday' : getRelativeDayName(date, today),
		formatWeekday(date, 'long'),
	]
		.filter(part => part !== undefined)
		.join(LABEL_SEPARATOR)
}

/** Short name of the day the Upcoming list shows at its top, e.g. "Today", "Tomorrow" or "Mon 9 Nov". */
export function getActiveDayLabel(date: CalendarDate, today: CalendarDate) {
	return (
		getRelativeDayName(date, today) ??
		`${formatWeekday(date, 'short')} ${formatDayMonth(date)}`
	)
}
