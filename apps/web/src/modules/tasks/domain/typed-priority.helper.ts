import { TASK_PRIORITIES } from '@soonlane/domain'

const WORD_PATTERN = /\S+/gu

function toPriority(word: string) {
	const token = word.toLowerCase()

	return TASK_PRIORITIES.find(priority => token === `p${priority}`)
}

/**
 * Reads "p1" to "p4" typed as words in a task name, in typed order (the last
 * one wins), the name to save without them and where the winning word sits.
 * A name without one comes back as is.
 */
export function parseTypedPriorities(title: string) {
	const words = [...title.matchAll(WORD_PATTERN)]
	const tokens = words.map(([word]) => toPriority(word))
	const priorities = tokens.filter(priority => priority !== undefined)
	const last = words[tokens.findLastIndex(priority => priority !== undefined)]
	if (!last) return { title, priorities }

	return {
		title: words
			.filter((_, index) => tokens[index] === undefined)
			.map(([word]) => word)
			.join(' '),
		priorities,
		range: { start: last.index, end: last.index + last[0].length },
	}
}
