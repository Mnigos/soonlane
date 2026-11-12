import { z } from 'zod'
import { CALENDAR_DATE_MAX, CALENDAR_DATE_MIN } from './calendar-date.constants'

/** Unbounded, for output: rows saved before the date bounds still list. */
export const storedCalendarDateSchema = z.iso.date().brand<'CalendarDate'>()

/** A day without time or zone, as `YYYY-MM-DD`; "today" is resolved in the user's own time zone before it becomes one. */
export type CalendarDate = z.infer<typeof storedCalendarDateSchema>

/** Bounded, for input. */
export const calendarDateSchema = z.iso
	.date()
	.refine(date => date >= CALENDAR_DATE_MIN && date <= CALENDAR_DATE_MAX, {
		message: `Dates must fall between ${CALENDAR_DATE_MIN} and ${CALENDAR_DATE_MAX}.`,
	})
	.brand<'CalendarDate'>()
