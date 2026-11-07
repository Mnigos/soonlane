import type { CalendarDate } from '@soonlane/domain'
import {
	addDays,
	formatMonthYear,
	formatWeekday,
	getDayOfMonth,
	getDaysFrom,
	getWeekStart,
	isBefore,
} from './calendar-date.helper'
import {
	DAYS_PER_WEEK,
	UPCOMING_WEEK_COUNT,
	UPCOMING_WEEKS_PER_LOAD,
} from './calendar.constants'

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

// The ranges touch without overlapping, so every day is in exactly one.
export function getUpcomingRanges(
	today: CalendarDate,
	weekCount: number
): DayRange[] {
	const ranges: DayRange[] = []
	let from = today

	for (
		let weeks = UPCOMING_WEEK_COUNT;
		weeks <= weekCount;
		weeks += UPCOMING_WEEKS_PER_LOAD
	) {
		const to = getUpcomingLastDay(today, weeks)

		ranges.push({ from, to })
		from = addDays(to, 1)
	}

	return ranges
}

export function getDaysThrough(
	from: CalendarDate,
	to: CalendarDate
): CalendarDate[] {
	const days: CalendarDate[] = []

	for (let day = from; !isBefore(to, day); day = addDays(day, 1)) days.push(day)

	return days
}

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
