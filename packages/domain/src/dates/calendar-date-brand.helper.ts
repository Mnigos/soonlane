import type { CalendarDate } from './calendar-date.types'

/** Brands a `YYYY-MM-DD` string built by the package's date arithmetic; not exported from the package, where the contract schemas brand dates. */
export function toCalendarDate(value: string): CalendarDate {
	return value as CalendarDate
}
