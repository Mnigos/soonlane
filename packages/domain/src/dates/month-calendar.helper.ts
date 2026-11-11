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
import type { CalendarDate } from './calendar-date.types'
import {
	CALENDAR_HORIZON_MONTHS,
	CALENDAR_MONTH_COUNT,
	DAYS_PER_WEEK,
} from './calendar.constants'

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

/** How many months the picker lists at first: a year past the later of today's and the chosen month. */
export function getInitialMonthCount(
	today: CalendarDate,
	selected: CalendarDate
) {
	return clampMonthCount(
		Math.max(getMonthOffset(today, selected), 0) + CALENDAR_MONTH_COUNT
	)
}

/** A month count kept between one and the picker's horizon, ten years from today's month. */
export function clampMonthCount(count: number) {
	return Math.min(Math.max(count, 1), CALENDAR_HORIZON_MONTHS + 1)
}

/** The first `count` months of the date picker, from today's month on. */
export function getCalendarMonths(today: CalendarDate, count: number) {
	const first = getMonthStart(today)

	return Array.from({ length: count }, (_, index) => addMonths(first, index))
}

/** The last day the date picker offers, at the end of its horizon's month. */
export function getCalendarLastDay(today: CalendarDate) {
	return addDays(
		addMonths(getMonthStart(today), CALENDAR_HORIZON_MONTHS + 1),
		-1
	)
}

/** Whether the date picker offers a day: from today up to its horizon's last month. */
export function isInCalendar(date: CalendarDate, today: CalendarDate) {
	return !(isBefore(date, today) || isBefore(getCalendarLastDay(today), date))
}

/** The nearest day the date picker offers: today for a past day, its last day for a later one. */
export function clampToCalendar(date: CalendarDate, today: CalendarDate) {
	const lastDay = getCalendarLastDay(today)
	if (isBefore(date, today)) return today

	return isBefore(lastDay, date) ? lastDay : date
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
