import { TASK_PRIORITIES } from '../tasks/task.constants'

const WORD_PATTERN = /\S+/gu

function toPriority(word: string) {
	const token = word.toLowerCase()

	return TASK_PRIORITIES.find(priority => token === `p${priority}`)
}

/**
 * Reads "p1" to "p4" typed as words in a task name, in typed order (the last
 * one wins), the name to save without them and where the winning word sits.
 * Words inside `labelWords` (typed labels) are neither priorities nor saved.
 * A name without either comes back as is.
 */
export function parseTypedPriorities(
	title: string,
	labelWords: readonly { start: number; end: number }[]
) {
	const words = [...title.matchAll(WORD_PATTERN)]
	const isLabelWord = ({ index }: RegExpExecArray) =>
		labelWords.some(({ start, end }) => index >= start && index < end)
	const tokens = words.map(word =>
		isLabelWord(word) ? undefined : toPriority(word[0])
	)
	const priorities = tokens.filter(priority => priority !== undefined)
	const last = words[tokens.findLastIndex(priority => priority !== undefined)]
	if (!last && labelWords.length === 0) return { title, priorities }

	return {
		title: words
			.filter(
				(word, index) => tokens[index] === undefined && !isLabelWord(word)
			)
			.map(([word]) => word)
			.join(' '),
		priorities,
		range: last && { start: last.index, end: last.index + last[0].length },
	}
}
