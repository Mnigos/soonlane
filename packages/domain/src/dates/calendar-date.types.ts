import type { Brand } from '../shared/brand.types'

/** A day without time or zone, as `YYYY-MM-DD`; "today" is resolved in the user's own time zone before it becomes one. */
export type CalendarDate = Brand<string, 'calendar_date'>

export function toCalendarDate(value: string): CalendarDate {
	return value as CalendarDate
}
