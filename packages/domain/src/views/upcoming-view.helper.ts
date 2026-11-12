import {
	addDays,
	formatMonthYear,
	formatWeekday,
	getDayOfMonth,
	getDaysFrom,
	getWeekStart,
	isBefore,
} from '../dates/calendar-date.helper'
import type { CalendarDate } from '../dates/calendar-date.schema'
import {
	DAYS_PER_WEEK,
	UPCOMING_WEEK_COUNT,
	UPCOMING_WEEKS_PER_LOAD,
} from '../dates/calendar.constants'

export interface WeekStripDay {
	date: CalendarDate
	weekday: string
	dayOfMonth: number
	isToday: boolean
	isActive: boolean
	isPast: boolean
}

export interface WeekStrip {
	monthLabel: string
	days: WeekStripDay[]
}

/** The Sunday that closes the `weekCount`-th week after the current one. */
export function getUpcomingLastDay(
	today: CalendarDate,
	weekCount: number
): CalendarDate {
	return addDays(getWeekStart(today), (weekCount + 1) * DAYS_PER_WEEK - 1)
}

export interface DayRange {
	from: CalendarDate
	to: CalendarDate
}

/**
 * The ranges the Upcoming list loads for `weekCount` weeks after the current
 * one: today to the end of the eighth week, then four weeks at a time. They
 * touch without overlapping, so every day is in exactly one.
 */
export function getUpcomingRanges(
	today: CalendarDate,
	weekCount: number
): DayRange[] {
	const lastDays: CalendarDate[] = []

	for (
		let weeks = UPCOMING_WEEK_COUNT;
		weeks <= weekCount;
		weeks += UPCOMING_WEEKS_PER_LOAD
	)
		lastDays.push(getUpcomingLastDay(today, weeks))

	return lastDays.map((to, index) => {
		const previous = lastDays[index - 1]

		return { from: previous ? addDays(previous, 1) : today, to }
	})
}

/** Every day from `from` through `to`. */
export function getDaysThrough(
	from: CalendarDate,
	to: CalendarDate
): CalendarDate[] {
	const days: CalendarDate[] = []

	for (let day = from; !isBefore(to, day); day = addDays(day, 1)) days.push(day)

	return days
}

/** The week around the active day (the one at the top of the list), with today marked separately. */
export function getWeekStrip(
	today: CalendarDate,
	activeDay: CalendarDate
): WeekStrip {
	return {
		monthLabel: formatMonthYear(activeDay),
		days: getDaysFrom(getWeekStart(activeDay), DAYS_PER_WEEK).map(date => ({
			date,
			weekday: formatWeekday(date, 'short'),
			dayOfMonth: getDayOfMonth(date),
			isToday: date === today,
			isActive: date === activeDay,
			isPast: isBefore(date, today),
		})),
	}
}
