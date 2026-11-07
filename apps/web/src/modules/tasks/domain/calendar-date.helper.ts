import { type CalendarDate, toCalendarDate } from '@soonlane/domain'
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

export function getDaysBetween(from: CalendarDate, to: CalendarDate) {
	return (
		(toUtcDate(to).getTime() - toUtcDate(from).getTime()) / MILLISECONDS_PER_DAY
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

export function formatDayMonthYear(date: CalendarDate) {
	return formatUtc(date, { day: 'numeric', month: 'short', year: 'numeric' })
}

/** "Mon 9 Nov", the hint next to a date shortcut. */
export function formatWeekdayDayMonth(date: CalendarDate) {
	return `${formatWeekday(date, 'short')} ${formatDayMonth(date)}`
}

export function formatMonthShort(date: CalendarDate) {
	return formatUtc(date, { month: 'short' })
}

export function formatMonthShortYear(date: CalendarDate) {
	return formatUtc(date, { month: 'short', year: 'numeric' })
}

/** The weekday as a column of a Monday-first week, 0 for Monday to 6 for Sunday. */
export function getWeekdayIndex(date: CalendarDate) {
	return (
		(toUtcDate(date).getUTCDay() - WEEK_STARTS_ON + DAYS_PER_WEEK) %
		DAYS_PER_WEEK
	)
}

const SATURDAY_INDEX = 5

/** Saturday or Sunday, which Todoist's calendar shows in grey. */
export function isWeekend(date: CalendarDate) {
	return getWeekdayIndex(date) >= SATURDAY_INDEX
}

export function getMonthStart(date: CalendarDate): CalendarDate {
	return toCalendarDate(`${date.slice(0, 7)}-01`)
}

export function addMonths(monthStart: CalendarDate, months: number) {
	const date = toUtcDate(monthStart)
	date.setUTCMonth(date.getUTCMonth() + months, 1)

	return fromUtcDate(date)
}

export function getDaysInMonth(monthStart: CalendarDate) {
	return getDayOfMonth(addDays(addMonths(monthStart, 1), -1))
}

/** "Friday 6 November 2026", the accessible name of a calendar day. */
export function formatLongDate(date: CalendarDate) {
	return formatUtc(date, {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	})
}

/** The same day of another month, or that month's last day when it is shorter. */
export function shiftMonths(date: CalendarDate, months: number) {
	const monthStart = addMonths(getMonthStart(date), months)
	const day = Math.min(getDayOfMonth(date), getDaysInMonth(monthStart))

	return addDays(monthStart, day - 1)
}

/** "6 November", the day of a yearly repeat. */
export function formatDayLongMonth(date: CalendarDate) {
	return formatUtc(date, { day: 'numeric', month: 'long' })
}
