import { type CalendarDate, toCalendarDate } from '@soonlist/domain'
import {
	DATE_LOCALE,
	DAYS_PER_WEEK,
	WEEK_STARTS_ON,
} from './calendar.constants'

const MILLISECONDS_PER_DAY = 86_400_000

// Calendar dates are computed as UTC midnights, so day arithmetic never crosses a DST shift.
function toUtcDate(date: CalendarDate) {
	return new Date(`${date}T00:00:00Z`)
}

function fromUtcDate(date: Date) {
	return toCalendarDate(date.toISOString().slice(0, 10))
}

function formatUtc(date: CalendarDate, options: Intl.DateTimeFormatOptions) {
	return new Intl.DateTimeFormat(DATE_LOCALE, {
		...options,
		timeZone: 'UTC',
	}).format(toUtcDate(date))
}

/** Today's date as seen in `timeZone`, or in the runtime's own zone when omitted (the browser's for the user). */
export function getToday(now: Date, timeZone?: string): CalendarDate {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).formatToParts(now)
	const part = (type: Intl.DateTimeFormatPartTypes) =>
		parts.find(entry => entry.type === type)?.value ?? ''

	return toCalendarDate(`${part('year')}-${part('month')}-${part('day')}`)
}

export function getMillisecondsUntilTomorrow(now: Date): number {
	const tomorrow = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate() + 1
	)

	return tomorrow.getTime() - now.getTime()
}

export function addDays(date: CalendarDate, days: number): CalendarDate {
	return fromUtcDate(
		new Date(toUtcDate(date).getTime() + days * MILLISECONDS_PER_DAY)
	)
}

export function getDaysFrom(start: CalendarDate, count: number) {
	return Array.from({ length: count }, (_, index) => addDays(start, index))
}

export function getWeekStart(date: CalendarDate): CalendarDate {
	const weekday = toUtcDate(date).getUTCDay()

	return addDays(
		date,
		-((weekday - WEEK_STARTS_ON + DAYS_PER_WEEK) % DAYS_PER_WEEK)
	)
}

export function isBefore(date: CalendarDate, other: CalendarDate) {
	return date < other
}

export function getDayOfMonth(date: CalendarDate) {
	return toUtcDate(date).getUTCDate()
}

export function formatDayMonth(date: CalendarDate) {
	return formatUtc(date, { day: 'numeric', month: 'short' })
}

export function formatWeekday(date: CalendarDate, width: 'long' | 'short') {
	return formatUtc(date, { weekday: width })
}

export function formatMonthYear(date: CalendarDate) {
	return formatUtc(date, { month: 'long', year: 'numeric' })
}
