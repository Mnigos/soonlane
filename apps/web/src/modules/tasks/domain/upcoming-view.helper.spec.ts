import { toCalendarDate } from '@soonlist/domain'
import { getUpcomingView } from './upcoming-view.helper'

const today = toCalendarDate('2026-11-05')

describe('getUpcomingView', () => {
	test('lists 14 days from today in the current week with the overdue section', () => {
		const view = getUpcomingView(today)
		expect(view.weekStart).toBe('2026-11-02')
		expect(view.isCurrentWeek).toBe(true)
		expect(view.showsOverdue).toBe(true)
		expect(view.monthLabel).toBe('November 2026')
		expect(view.days).toHaveLength(14)
		expect(view.days.at(0)).toBe('2026-11-05')
		expect(view.days.at(-1)).toBe('2026-11-18')
		expect(view.previousWeek).toBe('2026-10-26')
		expect(view.nextWeek).toBe('2026-11-09')
	})

	test('marks past days and today in the week strip', () => {
		expect(getUpcomingView(today).weekDays).toEqual([
			{
				date: '2026-11-02',
				weekday: 'Mon',
				dayOfMonth: 2,
				isToday: false,
				isPast: true,
			},
			{
				date: '2026-11-03',
				weekday: 'Tue',
				dayOfMonth: 3,
				isToday: false,
				isPast: true,
			},
			{
				date: '2026-11-04',
				weekday: 'Wed',
				dayOfMonth: 4,
				isToday: false,
				isPast: true,
			},
			{
				date: '2026-11-05',
				weekday: 'Thu',
				dayOfMonth: 5,
				isToday: true,
				isPast: false,
			},
			{
				date: '2026-11-06',
				weekday: 'Fri',
				dayOfMonth: 6,
				isToday: false,
				isPast: false,
			},
			{
				date: '2026-11-07',
				weekday: 'Sat',
				dayOfMonth: 7,
				isToday: false,
				isPast: false,
			},
			{
				date: '2026-11-08',
				weekday: 'Sun',
				dayOfMonth: 8,
				isToday: false,
				isPast: false,
			},
		])
	})

	test('lists a later week from its Monday without the overdue section', () => {
		const view = getUpcomingView(today, toCalendarDate('2026-11-25'))
		expect(view.weekStart).toBe('2026-11-23')
		expect(view.isCurrentWeek).toBe(false)
		expect(view.showsOverdue).toBe(false)
		expect(view.days.at(0)).toBe('2026-11-23')
		expect(view.weekDays.every(day => !(day.isPast || day.isToday))).toBe(true)
	})

	test('names the month of the first listed day', () => {
		expect(
			getUpcomingView(today, toCalendarDate('2026-11-30')).monthLabel
		).toBe('November 2026')
		expect(
			getUpcomingView(today, toCalendarDate('2026-12-07')).monthLabel
		).toBe('December 2026')
	})

	test.each(['2026-10-28', '2026-11-02', '2026-11-08'])(
		'falls back to the current week for %s',
		week => {
			const view = getUpcomingView(today, toCalendarDate(week))
			expect(view.weekStart).toBe('2026-11-02')
			expect(view.isCurrentWeek).toBe(true)
			expect(view.days.at(0)).toBe('2026-11-05')
		}
	)

	test('starts on Sunday today when the week is almost over', () => {
		const view = getUpcomingView(toCalendarDate('2026-11-08'))
		expect(view.weekStart).toBe('2026-11-02')
		expect(view.days.at(0)).toBe('2026-11-08')
		expect(view.weekDays.filter(day => day.isPast)).toHaveLength(6)
	})
})
