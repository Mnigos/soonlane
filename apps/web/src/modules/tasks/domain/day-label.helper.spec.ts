import { toCalendarDate } from '@soonlist/domain'
import { getDayHeading, getRelativeDayName } from './day-label.helper'

const today = toCalendarDate('2026-11-05')

describe('getRelativeDayName', () => {
	test.each([
		['2026-11-05', 'Today'],
		['2026-11-06', 'Tomorrow'],
		['2026-11-07', undefined],
		['2026-11-04', undefined],
	])('names %s as %s', (day, expected) => {
		expect(getRelativeDayName(toCalendarDate(day), today)).toBe(expected)
	})

	test('names tomorrow across a month boundary', () => {
		expect(
			getRelativeDayName(
				toCalendarDate('2026-12-01'),
				toCalendarDate('2026-11-30')
			)
		).toBe('Tomorrow')
	})
})

describe('getDayHeading', () => {
	test.each([
		['2026-11-05', '5 Nov · Today · Thursday'],
		['2026-11-06', '6 Nov · Tomorrow · Friday'],
		['2026-11-07', '7 Nov · Saturday'],
		['2026-12-14', '14 Dec · Monday'],
	])('labels %s as %s', (day, expected) => {
		expect(getDayHeading(toCalendarDate(day), today)).toBe(expected)
	})
})
