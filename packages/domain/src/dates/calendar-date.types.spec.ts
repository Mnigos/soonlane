/// <reference types="vitest/globals" />
import { expectTypeOf } from 'vitest'
import { type CalendarDate, toCalendarDate } from './calendar-date.types'

test('brands a calendar date without changing its stored value', () => {
	expect(toCalendarDate('2026-11-05')).toBe('2026-11-05')
	expectTypeOf(toCalendarDate('2026-11-05')).toEqualTypeOf<CalendarDate>()
	expectTypeOf<CalendarDate>().toExtend<string>()
	expectTypeOf<string>().not.toExtend<CalendarDate>()
})
