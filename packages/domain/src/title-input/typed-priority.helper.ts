import { TASK_PRIORITIES } from '../tasks/task.constants'
import { findFreeWords } from './title-word.helper'

function toPriority(word: string) {
	const token = word.toLowerCase()

	return TASK_PRIORITIES.find(priority => token === `p${priority}`)
}

/**
 * Reads "p1" to "p4" typed as words in a task name, in typed order (the last
 * one wins), the name to save without them and where the winning word sits.
 * Words inside `takenWords` (typed labels and the typed date) are neither
 * priorities nor saved. A name without either comes back as is.
 */
export function parseTypedPriorities(
	title: string,
	takenWords: readonly { start: number; end: number }[]
) {
	const words = findFreeWords(title, takenWords)
	const tokens = words.map(([word]) => toPriority(word))
	const priorities = tokens.filter(priority => priority !== undefined)
	const last = words[tokens.findLastIndex(priority => priority !== undefined)]
	if (!last && takenWords.length === 0) return { title, priorities }

	return {
		title: words
			.filter((_, index) => tokens[index] === undefined)
			.map(([word]) => word)
			.join(' '),
		priorities,
		range: last && { start: last.index, end: last.index + last[0].length },
	}
}
