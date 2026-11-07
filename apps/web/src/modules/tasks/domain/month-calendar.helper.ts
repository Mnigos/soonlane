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
import {
	CALENDAR_HORIZON_MONTHS,
	CALENDAR_MONTH_COUNT,
	DAYS_PER_WEEK,
} from './calendar.constants'

const MONTHS_PER_YEAR = 12

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

export function getVisibleWeeks(monthStart: CalendarDate, today: CalendarDate) {
	const weekStart = getWeekStart(today)

	return getMonthWeeks(monthStart).filter(week =>
		week.some(date => date && !isBefore(date, weekStart))
	)
}

export function getInitialMonthCount(
	today: CalendarDate,
	selected: CalendarDate
) {
	return clampMonthCount(
		Math.max(getMonthOffset(today, selected), 0) + CALENDAR_MONTH_COUNT
	)
}

export function clampMonthCount(count: number) {
	return Math.min(Math.max(count, 1), CALENDAR_HORIZON_MONTHS + 1)
}

export function getCalendarMonths(today: CalendarDate, count: number) {
	const first = getMonthStart(today)

	return Array.from({ length: count }, (_, index) => addMonths(first, index))
}

export function getCalendarLastDay(today: CalendarDate) {
	return addDays(
		addMonths(getMonthStart(today), CALENDAR_HORIZON_MONTHS + 1),
		-1
	)
}

export function isInCalendar(date: CalendarDate, today: CalendarDate) {
	return !(isBefore(date, today) || isBefore(getCalendarLastDay(today), date))
}

export function clampToCalendar(date: CalendarDate, today: CalendarDate) {
	const lastDay = getCalendarLastDay(today)
	if (isBefore(date, today)) return today

	return isBefore(lastDay, date) ? lastDay : date
}

export function formatMonthHeading(
	monthStart: CalendarDate,
	today: CalendarDate
) {
	return monthStart.slice(0, 4) === today.slice(0, 4)
		? formatMonthShort(monthStart)
		: formatMonthShortYear(monthStart)
}

export function getMonthOffset(today: CalendarDate, date: CalendarDate) {
	const [todayYear = 0, todayMonth = 0] = today.split('-').map(Number)
	const [year = 0, month = 0] = date.split('-').map(Number)

	return (year - todayYear) * MONTHS_PER_YEAR + month - todayMonth
}
