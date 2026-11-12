import {
	addDays,
	addMonths,
	formatDayLongMonth,
	formatWeekday,
	getCalendarDate,
	getDayOfMonth,
	getDaysInMonth,
	getMonthStart,
	getWeekStart,
	getWeekdayIndex,
	isBefore,
	isWeekend,
} from '../dates/calendar-date.helper'
import type { CalendarDate } from '../dates/calendar-date.types'
import { DATE_LOCALE, DAYS_PER_WEEK } from '../dates/calendar.constants'
import type { RepeatUnit } from './repeat-rule.constants'

/** The anchor is the due date the rule was set on; it keeps the weekday and day of month. */
export interface RepeatRule {
	unit: RepeatUnit
	interval: number
	anchor: CalendarDate
}

const MONTHS_PER_YEAR = 12
const ORDINAL_SUFFIXES: Partial<Record<Intl.LDMLPluralRule, string>> = {
	one: 'st',
	two: 'nd',
	few: 'rd',
}
const ordinalRules = new Intl.PluralRules(DATE_LOCALE, { type: 'ordinal' })

function formatOrdinal(value: number) {
	return `${value}${ORDINAL_SUFFIXES[ordinalRules.select(value)] ?? 'th'}`
}

function onAnchorDay(monthStart: CalendarDate, anchor: CalendarDate) {
	const day = Math.min(getDayOfMonth(anchor), getDaysInMonth(monthStart))

	return addDays(monthStart, day - 1)
}

function getNextOccurrence(
	date: CalendarDate,
	{ unit, interval, anchor }: RepeatRule
): CalendarDate {
	if (unit === 'day') return addDays(date, interval)
	if (unit === 'weekday') return getFirstOccurrence(addDays(date, 1), unit)
	if (unit === 'week') {
		const start = addDays(date, DAYS_PER_WEEK * (interval - 1))
		const offset =
			(getWeekdayIndex(anchor) - getWeekdayIndex(start) + DAYS_PER_WEEK) %
			DAYS_PER_WEEK

		return addDays(start, offset || DAYS_PER_WEEK)
	}
	if (unit === 'month')
		return onAnchorDay(addMonths(getMonthStart(date), interval), anchor)

	return onAnchorDay(
		addMonths(
			getCalendarDate(
				Number(date.slice(0, 4)),
				Number(anchor.slice(5, 7)) - 1,
				1
			),
			MONTHS_PER_YEAR
		),
		anchor
	)
}

/** Every weekday starts on the next Monday when the chosen day is a weekend, as in Todoist. */
export function getFirstOccurrence(
	dueDate: CalendarDate,
	unit: RepeatUnit | undefined
) {
	return unit === 'weekday' && isWeekend(dueDate)
		? addDays(getWeekStart(dueDate), DAYS_PER_WEEK)
		: dueDate
}

/** Snaps like a new task unless the edit keeps the stored due date and unit, e.g. a weekday task rescheduled to a Saturday. */
export function getEditedDueDate(
	task: { dueDate: CalendarDate; repeat?: { unit: RepeatUnit } } | undefined,
	dueDate: CalendarDate,
	unit: RepeatUnit | undefined
) {
	return task?.dueDate === dueDate && task.repeat?.unit === unit
		? dueDate
		: getFirstOccurrence(dueDate, unit)
}

/** An edit keeps the stored anchor unless it changes the due date or the rule's unit or interval. */
export function getEditedRule(
	task: {
		dueDate: CalendarDate
		repeat?: RepeatRule
	},
	dueDate: CalendarDate,
	repeat: Omit<RepeatRule, 'anchor'> | undefined
): RepeatRule | undefined {
	if (!repeat) return undefined

	const current = task.repeat
	const isSameSchedule =
		current !== undefined &&
		task.dueDate === dueDate &&
		current.unit === repeat.unit &&
		current.interval === repeat.interval

	return {
		...repeat,
		anchor: isSameSchedule ? current.anchor : dueDate,
	}
}

/** The due date after completing: one step past the due date, then on until it is not before today when known. */
export function getNextDueDate(
	dueDate: CalendarDate,
	rule: RepeatRule,
	today?: CalendarDate
) {
	for (
		let next = getNextOccurrence(dueDate, rule);
		;
		next = getNextOccurrence(next, rule)
	)
		if (!(today && isBefore(next, today))) return next
}

/** Todoist's label; `long` spells out the weekday range for screen readers. */
export function formatRepeatRule(
	{ unit, interval, anchor }: RepeatRule,
	width: 'long' | 'short' = 'short'
) {
	const every = (singular: string) =>
		interval === 1 ? `Every ${singular}` : `Every ${interval} ${singular}s`

	if (unit === 'day') return every('day')
	if (unit === 'weekday')
		return width === 'long'
			? 'Every weekday, Monday to Friday'
			: 'Every weekday (Mon - Fri)'
	if (unit === 'week')
		return `${every('week')} on ${formatWeekday(anchor, 'long')}`
	if (unit === 'month')
		return `${every('month')} on the ${formatOrdinal(getDayOfMonth(anchor))}`

	return `Every year on ${formatDayLongMonth(anchor)}`
}
