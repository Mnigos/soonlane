import { TASK_PRIORITIES } from '@soonlane/domain'

const SPACES_PATTERN = /\s+/u

function toPriority(word: string) {
	const token = word.toLowerCase()

	return TASK_PRIORITIES.find(priority => token === `p${priority}`)
}

/**
 * Reads "p1" to "p4" typed as words in a task name, in typed order (the last
 * one wins), and the name to save without them. A name without one comes
 * back as is.
 */
export function parseTypedPriorities(title: string) {
	const words = title.split(SPACES_PATTERN)
	const tokens = words.map(toPriority)
	const priorities = tokens.filter(priority => priority !== undefined)
	if (priorities.length === 0) return { title, priorities }

	return {
		title: words
			.filter((_, index) => tokens[index] === undefined)
			.join(' ')
			.trim(),
		priorities,
	}
}
