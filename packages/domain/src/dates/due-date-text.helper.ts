import {
	addDays,
	getCalendarDate,
	getDaysInMonth,
	getWeekdayIndex,
	isBefore,
} from './calendar-date.helper'
import type { CalendarDate } from './calendar-date.schema'
import { DAYS_PER_WEEK } from './calendar.constants'
import { getDueDateShortcuts } from './due-date-shortcut.helper'

const MONTHS = [
	'january',
	'february',
	'march',
	'april',
	'may',
	'june',
	'july',
	'august',
	'september',
	'october',
	'november',
	'december',
]
const WEEKDAYS = [
	'monday',
	'tuesday',
	'wednesday',
	'thursday',
	'friday',
	'saturday',
	'sunday',
]
const ALIASES: Record<string, string> = {
	tod: 'today',
	tom: 'tomorrow',
	tmr: 'tomorrow',
}
const ISO_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/u
const DAY_MONTH_PATTERN = /^(\d{1,2})\s+([a-z]{3,})\.?(?:\s+(\d{4}))?$/u
const MONTH_DAY_PATTERN = /^([a-z]{3,})\.?\s+(\d{1,2})(?:,?\s+(\d{4}))?$/u
const SPACES_PATTERN = /\s+/gu

function toDate(year: number, month: number, day: number) {
	if (month < 0 || month >= MONTHS.length) return undefined

	const monthStart = getCalendarDate(year, month, 1)
	if (day < 1 || day > getDaysInMonth(monthStart)) return undefined

	return addDays(monthStart, day - 1)
}

function findByPrefix(names: string[], word: string) {
	const index = names.findIndex(name => name.startsWith(word))

	return index === -1 ? undefined : index
}

/** A day and month without a year means the next one on or after today. */
function fromDayMonth(
	day: number,
	monthName: string,
	year: string | undefined,
	today: CalendarDate
) {
	const month = findByPrefix(MONTHS, monthName)
	if (month === undefined) return undefined

	const thisYear = Number(today.slice(0, 4))
	if (year) return toDate(Number(year), month, day)

	const date = toDate(thisYear, month, day)
	if (date && isBefore(date, today)) return toDate(thisYear + 1, month, day)

	return date
}

/** A weekday or a prefix of one, at least three letters ("fri"): that day on or after today. */
export function parseWeekdayText(word: string, today: CalendarDate) {
	if (!/^[a-z]{3,}$/u.test(word)) return undefined

	const weekday = findByPrefix(WEEKDAYS, word)
	if (weekday === undefined) return undefined

	const offset =
		(weekday - getWeekdayIndex(today) + DAYS_PER_WEEK) % DAYS_PER_WEEK

	return addDays(today, offset)
}

/**
 * Reads what the owner types in the date picker: "today", "tom", "next
 * week", "fri", "14 Nov", "Nov 14 2027" or "2026-11-14". Returns `undefined`
 * when the text is not a date.
 */
export function parseDueDateText(
	text: string,
	today: CalendarDate
): CalendarDate | undefined {
	const input = text.trim().toLowerCase().replaceAll(SPACES_PATTERN, ' ')
	const phrase = ALIASES[input] ?? input
	const shortcut = getDueDateShortcuts(today).find(
		({ label }) => label.toLowerCase() === phrase
	)
	if (shortcut) return shortcut.date

	const iso = ISO_PATTERN.exec(input)
	if (iso) return toDate(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))

	const dayMonth = DAY_MONTH_PATTERN.exec(input)
	if (dayMonth)
		return fromDayMonth(
			Number(dayMonth[1]),
			dayMonth[2] ?? '',
			dayMonth[3],
			today
		)

	const monthDay = MONTH_DAY_PATTERN.exec(input)
	if (monthDay)
		return fromDayMonth(
			Number(monthDay[2]),
			monthDay[1] ?? '',
			monthDay[3],
			today
		)

	return parseWeekdayText(input, today)
}
