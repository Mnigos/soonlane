import type { CalendarDate } from '@soonlane/domain'
import {
	addDays,
	getDaysInMonth,
	getWeekdayIndex,
} from './calendar-date.helper'
import { DAYS_PER_WEEK } from './calendar.constants'

/** The weeks of a month for a Monday-first grid; days of other months are `undefined`. */
export function getMonthWeeks(monthStart: CalendarDate) {
	const cells: (CalendarDate | undefined)[] = [
		...Array.from<undefined>({ length: getWeekdayIndex(monthStart) }),
		...Array.from({ length: getDaysInMonth(monthStart) }, (_, index) =>
			addDays(monthStart, index)
		),
	]
	const weeks: (CalendarDate | undefined)[][] = []

	for (let start = 0; start < cells.length; start += DAYS_PER_WEEK)
		weeks.push(cells.slice(start, start + DAYS_PER_WEEK))

	return weeks
}
