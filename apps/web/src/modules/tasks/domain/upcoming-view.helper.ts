import type { CalendarDate } from '@soonlist/domain'
import {
	addDays,
	formatMonthYear,
	formatWeekday,
	getDayOfMonth,
	getDaysFrom,
	getWeekStart,
	isBefore,
} from './calendar-date.helper'
import { DAYS_PER_WEEK, UPCOMING_WEEK_COUNT } from './calendar.constants'

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

/** Days the Upcoming list renders: today through the Sunday that closes the eighth week after the current one. */
export function getUpcomingDays(today: CalendarDate): CalendarDate[] {
	const lastDay = addDays(
		getWeekStart(today),
		(UPCOMING_WEEK_COUNT + 1) * DAYS_PER_WEEK - 1
	)
	const days: CalendarDate[] = []

	for (let day = today; !isBefore(lastDay, day); day = addDays(day, 1))
		days.push(day)

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
