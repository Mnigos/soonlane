import {
	addMonths,
	getDayOfMonth,
	getMonthStart,
	isBefore,
	onDayOfMonth,
} from '../dates/calendar-date.helper'
import type { CalendarDate } from '../dates/calendar-date.schema'
import {
	parseDueDateText,
	parseWeekdayText,
} from '../dates/due-date-text.helper'
import {
	REPEAT_INTERVAL_MAX,
	type RepeatUnit,
	SINGLE_INTERVAL_REPEAT_UNITS,
} from '../tasks/repeat-rule.constants'
import { findFreeWords, readPhrases, type TitleWord } from './title-word.helper'

interface Schedule {
	unit: RepeatUnit
	interval: number
	/** The day the phrase names ("every fri"), which becomes the due date. */
	date?: CalendarDate
	wordCount: 1 | 2
}

const UNIT_WORDS = new Map<string, RepeatUnit>([
	['day', 'day'],
	['weekday', 'weekday'],
	['workday', 'weekday'],
	['week', 'week'],
	['month', 'month'],
	['year', 'year'],
])
const COUNT_PATTERN = /^\d+$/u
const ORDINAL_PATTERN = /^(\d{1,2})(?:st|nd|rd|th)$/u
const PLURAL_PATTERN = /s$/u
const YEAR_PATTERN = /^\d{4}$/u
const LONGEST_MONTH = 31

function toInterval(word: string) {
	if (word === 'other') return 2

	return COUNT_PATTERN.test(word) ? Number(word) : undefined
}

function isValidInterval(unit: RepeatUnit, interval: number) {
	return (
		interval >= 1 &&
		interval <= REPEAT_INTERVAL_MAX &&
		(interval === 1 || !SINGLE_INTERVAL_REPEAT_UNITS.includes(unit))
	)
}

/** The next date on or after today that has this day of month, so "every 31st" anchors on a 31st. */
function onNextDayOfMonth(
	day: number,
	today: CalendarDate,
	monthStart = getMonthStart(today)
): CalendarDate {
	const date = onDayOfMonth(monthStart, day)

	return getDayOfMonth(date) === day && !isBefore(date, today)
		? date
		: onNextDayOfMonth(day, today, addMonths(monthStart, 1))
}

function readSchedule(
	[first = '', second = '']: string[],
	today: CalendarDate
): Schedule | undefined {
	const unit = UNIT_WORDS.get(first)
	if (unit) return { unit, interval: 1, wordCount: 1 }

	const countedUnit = UNIT_WORDS.get(second.replace(PLURAL_PATTERN, ''))
	const interval = toInterval(first)
	if (countedUnit && interval !== undefined)
		return isValidInterval(countedUnit, interval)
			? { unit: countedUnit, interval, wordCount: 2 }
			: undefined

	const weekday = parseWeekdayText(first, today)
	if (weekday) return { unit: 'week', interval: 1, date: weekday, wordCount: 1 }

	const day = Number(ORDINAL_PATTERN.exec(first)?.[1])
	if (day >= 1 && day <= LONGEST_MONTH)
		return {
			unit: 'month',
			interval: 1,
			date: onNextDayOfMonth(day, today),
			wordCount: 1,
		}

	const monthDay = `${first} ${second}`
	const date =
		second && /\d/u.test(monthDay)
			? parseDueDateText(monthDay, today)
			: undefined

	return date && { unit: 'year', interval: 1, date, wordCount: 2 }
}

function readRepeatRule(
	title: string,
	[every, ...words]: TitleWord[],
	takenWords: readonly { start: number; end: number }[],
	today: CalendarDate
) {
	const keyword = every?.[0].toLowerCase()
	if (!(every && (keyword === 'every' || keyword === 'every!')))
		return undefined

	const fromCompletion = keyword === 'every!'
	const schedule = readSchedule(
		words.slice(0, 2).map(([word]) => word.toLowerCase()),
		today
	)
	const last = schedule && words[schedule.wordCount - 1]
	if (!(schedule && last) || (fromCompletion && schedule.date)) return undefined
	// "every jan 27 2030" is a date with a year, which the date reader takes whole.
	if (schedule.date && YEAR_PATTERN.test(words[schedule.wordCount]?.[0] ?? ''))
		return undefined

	const end = last.index + last[0].length
	if (takenWords.some(({ start }) => start > every.index && start < end))
		return undefined

	return {
		rule: { unit: schedule.unit, interval: schedule.interval, fromCompletion },
		date: schedule.date,
		text: title.slice(every.index, end),
		start: every.index,
		end,
	}
}

/** "every …" and "every! …" phrases in a task name, in typed order (the last one wins), never across `takenWords`; dismissing one is the caller's job. */
export function findTypedRepeatRules(
	title: string,
	takenWords: readonly { start: number; end: number }[],
	today: CalendarDate
) {
	return readPhrases(findFreeWords(title, takenWords), words =>
		readRepeatRule(title, words, takenWords, today)
	)
}
