import {
	CALENDAR_DATE_MAX,
	CALENDAR_DATE_MIN,
	type CalendarDate,
} from '@soonlane/domain'
import { z } from 'zod'

/** Unbounded, for output: rows saved before the date bounds still list. */
export const storedCalendarDateSchema = z.iso
	.date()
	.transform(date => date as CalendarDate)

/** Bounded, for input. */
export const calendarDateSchema = z.iso
	.date()
	.refine(date => date >= CALENDAR_DATE_MIN && date <= CALENDAR_DATE_MAX, {
		message: `Dates must fall between ${CALENDAR_DATE_MIN} and ${CALENDAR_DATE_MAX}.`,
	})
	.transform(date => date as CalendarDate)
