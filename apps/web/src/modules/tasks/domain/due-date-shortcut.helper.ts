import type { CalendarDate } from '@soonlane/domain'
import {
	addDays,
	formatWeekday,
	formatWeekdayDayMonth,
	getWeekStart,
	getWeekdayIndex,
} from './calendar-date.helper'
import { DAYS_PER_WEEK } from './calendar.constants'

export type DueDateShortcutId =
	| 'today'
	| 'tomorrow'
	| 'this-weekend'
	| 'next-week'
	| 'next-weekend'

export interface DueDateShortcut {
	id: DueDateShortcutId
	label: string
	date: CalendarDate
	hint: string
}

const SATURDAY_INDEX = 5
const FRIDAY_INDEX = 4

// Like Todoist, This weekend is offered only from Monday to Thursday.
export function getDueDateShortcuts(today: CalendarDate): DueDateShortcut[] {
	const tomorrow = addDays(today, 1)
	const nextMonday = addDays(getWeekStart(today), DAYS_PER_WEEK)
	const thisSaturday = addDays(getWeekStart(today), SATURDAY_INDEX)
	const shortcuts: DueDateShortcut[] = [
		{
			id: 'today',
			label: 'Today',
			date: today,
			hint: formatWeekday(today, 'short'),
		},
		{
			id: 'tomorrow',
			label: 'Tomorrow',
			date: tomorrow,
			hint: formatWeekday(tomorrow, 'short'),
		},
	]

	if (getWeekdayIndex(today) < FRIDAY_INDEX)
		shortcuts.push({
			id: 'this-weekend',
			label: 'This weekend',
			date: thisSaturday,
			hint: formatWeekday(thisSaturday, 'short'),
		})

	const nextSaturday = addDays(nextMonday, SATURDAY_INDEX)

	shortcuts.push(
		{
			id: 'next-week',
			label: 'Next week',
			date: nextMonday,
			hint: formatWeekdayDayMonth(nextMonday),
		},
		{
			id: 'next-weekend',
			label: 'Next weekend',
			date: nextSaturday,
			hint: formatWeekdayDayMonth(nextSaturday),
		}
	)

	return shortcuts
}
