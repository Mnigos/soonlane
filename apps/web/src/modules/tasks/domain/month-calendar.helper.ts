import type { CalendarDate } from '@soonlane/domain'
import {
	addDays,
	addMonths,
	formatMonthShort,
	formatMonthShortYear,
	getDaysInMonth,
	getMonthStart,
	getWeekStart,
	getWeekdayIndex,
	isBefore,
} from './calendar-date.helper'
import { CALENDAR_MONTH_COUNT, DAYS_PER_WEEK } from './calendar.constants'

const MONTHS_PER_YEAR = 12

/** The weeks of a month for a Monday-first grid; days of other months are `undefined`. */
function getMonthWeeks(monthStart: CalendarDate) {
	const cells: (CalendarDate | undefined)[] = [
		...Array.from<undefined>({ length: getWeekdayIndex(monthStart) }),
		...Array.from({ length: getDaysInMonth(monthStart) }, (_, index) =>
			addDays(monthStart, index)
		),
	]
	const weeks: (CalendarDate | undefined)[][] = []

	for (let start = 0; start < cells.length; start += DAYS_PER_WEEK)
		weeks.push(cells.slice(start, start + DAYS_PER_WEEK))

	return weeks
}

/** A month's weeks from today's week on, like Todoist's picker, which never shows earlier weeks. */
export function getVisibleWeeks(monthStart: CalendarDate, today: CalendarDate) {
	const weekStart = getWeekStart(today)

	return getMonthWeeks(monthStart).filter(week =>
		week.some(date => date && !isBefore(date, weekStart))
	)
}

/** The months the date picker lists: a year from today's month, or up to the chosen month when later. */
export function getCalendarMonths(today: CalendarDate, selected: CalendarDate) {
	const first = getMonthStart(today)
	const yearEnd = addMonths(first, CALENDAR_MONTH_COUNT - 1)
	const selectedMonth = getMonthStart(selected)
	const last = isBefore(yearEnd, selectedMonth) ? selectedMonth : yearEnd
	const months = [first]

	for (let month = first; isBefore(month, last);) {
		month = addMonths(month, 1)
		months.push(month)
	}

	return months
}

/** "Dec" between months in the picker, "Jan 2027" once the year changes. */
export function formatMonthHeading(
	monthStart: CalendarDate,
	today: CalendarDate
) {
	return monthStart.slice(0, 4) === today.slice(0, 4)
		? formatMonthShort(monthStart)
		: formatMonthShortYear(monthStart)
}

/** How many months after today's month a date falls, its index in the picker's list. */
export function getMonthOffset(today: CalendarDate, date: CalendarDate) {
	const [todayYear = 0, todayMonth = 0] = today.split('-').map(Number)
	const [year = 0, month = 0] = date.split('-').map(Number)

	return (year - todayYear) * MONTHS_PER_YEAR + month - todayMonth
}
