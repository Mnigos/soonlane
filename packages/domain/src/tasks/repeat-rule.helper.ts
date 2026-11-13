import {
	addDays,
	addMonths,
	formatDayLongMonth,
	formatWeekday,
	getCalendarDate,
	getDayOfMonth,
	getMonthStart,
	getWeekStart,
	getWeekdayIndex,
	isBefore,
	isWeekend,
	onDayOfMonth,
} from '../dates/calendar-date.helper'
import type { CalendarDate } from '../dates/calendar-date.schema'
import { DATE_LOCALE, DAYS_PER_WEEK } from '../dates/calendar.constants'
import type { RepeatUnit } from './repeat-rule.constants'

/**
 * The anchor is the due date the rule was set on; it keeps the weekday and day of month.
 * `fromCompletion` ("every!") counts the next due date from the completion day instead.
 */
export interface RepeatRule {
	unit: RepeatUnit
	interval: number
	anchor: CalendarDate
	fromCompletion?: boolean
}

/** The due date and repeat rule a task has before an edit. */
interface TaskSchedule {
	dueDate?: CalendarDate
	repeat?: RepeatRule
}

/** The due date, time and complete rule a task has before a field-level edit. */
interface StoredSchedule extends TaskSchedule {
	dueTime?: string
	repeat?: Required<RepeatRule>
}

/** A field-level edit of a task's schedule: an absent field keeps the task's, null clears it. */
interface ScheduleEdit {
	dueDate?: CalendarDate | null
	dueTime?: string | null
	repeat?: Omit<RepeatRule, 'anchor'> | null
}

const MONTHS_PER_YEAR = 12
const ORDINAL_SUFFIXES: Partial<Record<Intl.LDMLPluralRule, string>> = {
	one: 'st',
	two: 'nd',
	few: 'rd',
}
/** Created on first use: an engine without `Intl.PluralRules` (Hermes) must still import the domain. */
let ordinalRules: Intl.PluralRules | undefined

function formatOrdinal(value: number) {
	ordinalRules ??= new Intl.PluralRules(DATE_LOCALE, { type: 'ordinal' })

	return `${value}${ORDINAL_SUFFIXES[ordinalRules.select(value)] ?? 'th'}`
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
		return onDayOfMonth(
			addMonths(getMonthStart(date), interval),
			getDayOfMonth(anchor)
		)

	return onDayOfMonth(
		addMonths(
			getCalendarDate(
				Number(date.slice(0, 4)),
				Number(anchor.slice(5, 7)) - 1,
				1
			),
			MONTHS_PER_YEAR
		),
		getDayOfMonth(anchor)
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
	task: TaskSchedule | undefined,
	dueDate: CalendarDate,
	unit: RepeatUnit | undefined
) {
	return task?.dueDate === dueDate && task.repeat?.unit === unit
		? dueDate
		: getFirstOccurrence(dueDate, unit)
}

/** An edit keeps the stored anchor unless it changes the due date or the rule's unit or interval; the rule counts from completion only when the edit says so. */
export function getEditedRule(
	task: TaskSchedule,
	dueDate: CalendarDate,
	repeat: Omit<RepeatRule, 'anchor'> | undefined
): Required<RepeatRule> | undefined {
	if (!repeat) return undefined

	const current = task.repeat
	const isSameSchedule =
		current !== undefined &&
		task.dueDate === dueDate &&
		current.unit === repeat.unit &&
		current.interval === repeat.interval

	return {
		...repeat,
		fromCompletion: repeat.fromCompletion ?? false,
		anchor: isSameSchedule ? current.anchor : dueDate,
	}
}

/**
 * The due date, time and rule a field-level edit leaves: absent keeps the task's, null clears it, and no due date clears the
 * time and the rule. A new due date snaps and re-anchors against the kept or edited rule.
 */
export function getEditedSchedule(task: StoredSchedule, edit: ScheduleEdit) {
	if (edit.dueDate === null)
		return { dueDate: undefined, dueTime: undefined, repeat: undefined }

	const dueTime =
		edit.dueTime === undefined ? task.dueTime : (edit.dueTime ?? undefined)

	if (edit.dueDate === undefined)
		return {
			dueDate: task.dueDate,
			dueTime,
			repeat: edit.repeat === null ? undefined : task.repeat,
		}

	const rule =
		edit.repeat === undefined ? task.repeat : (edit.repeat ?? undefined)
	const dueDate = getEditedDueDate(task, edit.dueDate, rule?.unit)

	return { dueDate, dueTime, repeat: getEditedRule(task, dueDate, rule) }
}

/**
 * The due date after completing: one step past the due date, then on until it is not before today when known.
 * An "every!" rule takes one step from today, the completion day, as if the rule had been set on it.
 */
export function getNextDueDate(
	dueDate: CalendarDate,
	rule: RepeatRule,
	today?: CalendarDate
) {
	if (rule.fromCompletion && today)
		return getNextOccurrence(today, { ...rule, anchor: today })

	for (
		let next = getNextOccurrence(dueDate, rule);
		;
		next = getNextOccurrence(next, rule)
	)
		if (!(today && isBefore(next, today))) return next
}

/** Todoist's label; `long` spells out the weekday range for screen readers. An "every!" rule names no day, since completing picks it. */
export function formatRepeatRule(
	{ unit, interval, anchor, fromCompletion }: RepeatRule,
	width: 'long' | 'short' = 'short'
) {
	const every = (singular: string) =>
		interval === 1 ? `Every ${singular}` : `Every ${interval} ${singular}s`

	if (fromCompletion && unit === 'weekday')
		return width === 'long'
			? 'Every weekday, Monday to Friday, after completion'
			: 'Every weekday after completion'
	if (fromCompletion) return `${every(unit)} after completion`
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
