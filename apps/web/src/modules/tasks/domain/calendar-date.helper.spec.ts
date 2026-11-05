import { toCalendarDate } from '@soonlist/domain'
import {
	addDays,
	formatDayMonth,
	formatMonthYear,
	formatWeekday,
	getDayOfMonth,
	getDaysFrom,
	getMillisecondsUntilTomorrow,
	getToday,
	getWeekStart,
	isBefore,
} from './calendar-date.helper'

const date = toCalendarDate

describe('getToday', () => {
	test.each([
		['Europe/Warsaw', '2026-11-06'],
		['UTC', '2026-11-05'],
		['America/Los_Angeles', '2026-11-05'],
	])('reads the calendar day in %s', (timeZone, expected) => {
		expect(getToday(new Date('2026-11-05T23:30:00Z'), timeZone)).toBe(expected)
	})

	test('pads single-digit months and days', () => {
		expect(getToday(new Date('2026-01-02T12:00:00Z'), 'UTC')).toBe('2026-01-02')
	})
})

test('counts the time left until local midnight', () => {
	expect(getMillisecondsUntilTomorrow(new Date(2026, 10, 5, 23, 59, 30))).toBe(
		30_000
	)
})

describe('addDays', () => {
	test.each([
		['2026-11-05', 1, '2026-11-06'],
		['2026-11-30', 1, '2026-12-01'],
		['2026-12-31', 1, '2027-01-01'],
		['2028-02-28', 1, '2028-02-29'],
		['2026-03-01', -1, '2026-02-28'],
		['2026-03-28', 2, '2026-03-30'],
		['2026-10-24', 2, '2026-10-26'],
	])('%s + %i is %s', (start, days, expected) => {
		expect(addDays(date(start), days)).toBe(expected)
	})
})

test('lists consecutive days from a start date', () => {
	expect(getDaysFrom(date('2026-11-29'), 3)).toEqual([
		'2026-11-29',
		'2026-11-30',
		'2026-12-01',
	])
})

describe('getWeekStart', () => {
	test.each([
		['2026-11-02', '2026-11-02'],
		['2026-11-05', '2026-11-02'],
		['2026-11-08', '2026-11-02'],
		['2026-11-09', '2026-11-09'],
		['2027-01-01', '2026-12-28'],
	])('starts the week of %s on Monday %s', (day, expected) => {
		expect(getWeekStart(date(day))).toBe(expected)
	})
})

test('compares calendar dates', () => {
	expect(isBefore(date('2026-11-04'), date('2026-11-05'))).toBe(true)
	expect(isBefore(date('2026-11-05'), date('2026-11-05'))).toBe(false)
	expect(isBefore(date('2026-12-01'), date('2026-11-30'))).toBe(false)
})

test('formats labels in English regardless of the runtime zone', () => {
	const day = date('2026-11-05')
	expect(getDayOfMonth(day)).toBe(5)
	expect(formatDayMonth(day)).toBe('5 Nov')
	expect(formatWeekday(day, 'long')).toBe('Thursday')
	expect(formatWeekday(day, 'short')).toBe('Thu')
	expect(formatMonthYear(day)).toBe('November 2026')
})
