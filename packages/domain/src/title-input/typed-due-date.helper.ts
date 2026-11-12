import type { CalendarDate } from '../dates/calendar-date.schema'
import { parseDueDateText } from '../dates/due-date-text.helper'
import { isInCalendar } from '../views/month-calendar.helper'
import { findFreeWords, readPhrases, type TitleWord } from './title-word.helper'

const WORD_COUNTS = [3, 2, 1]

/** The longest run of words from the first of `words` that the date grammar reads. */
function readDate(title: string, words: TitleWord[], today: CalendarDate) {
	const [first] = words

	return WORD_COUNTS.flatMap(count => {
		const last = words[count - 1]
		if (!(first && last)) return []

		const end = last.index + last[0].length
		const text = title.slice(first.index, end)
		const date = parseDueDateText(text, today)

		return date ? [{ date, text, start: first.index, end }] : []
	}).at(0)
}

/**
 * Due dates typed as whole words in a task name, in typed order (the last one
 * wins): what the date picker reads, up to three words ("nov 14, 2027").
 * Words inside `takenWords` are skipped; a date the picker would refuse or a
 * text in `dismissedWords` stays plain words.
 */
export function findTypedDueDates(
	title: string,
	takenWords: readonly { start: number; end: number }[],
	dismissedWords: readonly string[],
	today: CalendarDate
) {
	return readPhrases(findFreeWords(title, takenWords), words =>
		readDate(title, words, today)
	).filter(
		({ date, text }) =>
			isInCalendar(date, today) && !dismissedWords.includes(text)
	)
}
