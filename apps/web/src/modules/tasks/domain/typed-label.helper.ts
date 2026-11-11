const REGEXP_SYNTAX = /[\\^$.*+?()[\]{}|/]/gu
const WORD_START_AT = /(?<=^|\s)@/gu

/** Every "@name" word in a task name naming one of `labels`, ignoring case; names may hold spaces, so the longest wins. */
export function parseTypedLabels<TLabel extends { name: string }>(
	title: string,
	labels: readonly TLabel[]
) {
	if (labels.length === 0) return []

	const byName = new Map(labels.map(label => [label.name.toLowerCase(), label]))
	const names = labels
		.map(({ name }) => name)
		.toSorted((a, b) => b.length - a.length)
		.map(name => name.replaceAll(REGEXP_SYNTAX, String.raw`\$&`))
	const pattern = new RegExp(
		String.raw`(?<=^|\s)@(${names.join('|')})(?=\s|$)`,
		'giu'
	)

	return [...title.matchAll(pattern)].flatMap(match => {
		const label = byName.get(match[1]?.toLowerCase() ?? '')

		return label
			? [{ label, start: match.index, end: match.index + match[0].length }]
			: []
	})
}

/** The "@" word the caret is typing in, if any: where its "@" sits and what follows up to the caret. */
export function findLabelQuery(title: string, caret: number) {
	const before = title.slice(0, caret)
	const start = [...before.matchAll(WORD_START_AT)].at(-1)?.index

	return start === undefined
		? undefined
		: { start, query: before.slice(start + 1) }
}

/** The task name without these words, each with the space after it. */
export function removeWords(
	title: string,
	words: readonly { start: number; end: number }[]
) {
	return words
		.toSorted((a, b) => b.start - a.start)
		.reduce(
			(text, { start, end }) =>
				text.slice(0, start) + text.slice(end).replace(/^\s/u, ''),
			title
		)
}
