import { task } from '@soonlane/db'
import { and, or, sql } from 'drizzle-orm'
import { DAY_ORDER } from './owned-tasks.query'

function containsWord(word: string) {
	const pattern = `%${word.replaceAll(/[\\%_]/gu, '\\$&')}%`

	return or(
		sql`${task.title} ilike ${pattern} escape '\\'`,
		sql`${task.description} ilike ${pattern} escape '\\'`
	)
}

/** Every word of the query appears in the title or the description, read as plain text, never as a pattern. */
export function matchesEveryWord(query: string) {
	return and(...query.split(/\s+/u).map(containsWord))
}

/** Open tasks in day order, then completed ones, last completed first. */
export const SEARCH_ORDER = [
	sql`${task.completedAt} desc nulls first`,
	...DAY_ORDER,
]
