const WORD_PATTERN = /\S+/gu

/** The task name's words outside `takenWords`, each with where it starts. */
export function findFreeWords(
	title: string,
	takenWords: readonly { start: number; end: number }[]
) {
	return [...title.matchAll(WORD_PATTERN)].filter(
		({ index }) =>
			!takenWords.some(({ start, end }) => index >= start && index < end)
	)
}

export type TitleWord = ReturnType<typeof findFreeWords>[number]

/** Every match `read` finds from the first of `words`, scanning on after each one, so matches never overlap. */
export function readPhrases<TPhrase extends { end: number }>(
	words: TitleWord[],
	read: (words: TitleWord[]) => TPhrase | undefined
): TPhrase[] {
	const [first, ...rest] = words
	if (!first) return []

	const match = read(words)
	if (!match) return readPhrases(rest, read)

	return [
		match,
		...readPhrases(
			words.filter(({ index }) => index >= match.end),
			read
		),
	]
}
