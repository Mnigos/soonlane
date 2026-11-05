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
import { DAYS_PER_WEEK, UPCOMING_DAY_COUNT } from './calendar.constants'

export interface WeekStripDay {
	date: CalendarDate
	weekday: string
	dayOfMonth: number
	isToday: boolean
	isPast: boolean
}

export interface UpcomingView {
	weekStart: CalendarDate
	isCurrentWeek: boolean
	previousWeek: CalendarDate
	nextWeek: CalendarDate
	monthLabel: string
	weekDays: WeekStripDay[]
	days: CalendarDate[]
	showsOverdue: boolean
}

/**
 * Days the Upcoming view shows for the selected week. The current week lists
 * from today with the overdue section; a later week lists from its Monday. A
 * week before the current one falls back to the current week.
 */
export function getUpcomingView(
	today: CalendarDate,
	requestedWeek?: CalendarDate
): UpcomingView {
	const currentWeek = getWeekStart(today)
	const requestedStart = requestedWeek && getWeekStart(requestedWeek)
	const weekStart =
		requestedStart && isBefore(currentWeek, requestedStart)
			? requestedStart
			: currentWeek
	const isCurrentWeek = weekStart === currentWeek
	const listStart = isCurrentWeek ? today : weekStart

	return {
		weekStart,
		isCurrentWeek,
		previousWeek: addDays(weekStart, -DAYS_PER_WEEK),
		nextWeek: addDays(weekStart, DAYS_PER_WEEK),
		monthLabel: formatMonthYear(listStart),
		weekDays: getDaysFrom(weekStart, DAYS_PER_WEEK).map(date => ({
			date,
			weekday: formatWeekday(date, 'short'),
			dayOfMonth: getDayOfMonth(date),
			isToday: date === today,
			isPast: isBefore(date, today),
		})),
		days: getDaysFrom(listStart, UPCOMING_DAY_COUNT),
		showsOverdue: isCurrentWeek,
	}
}
