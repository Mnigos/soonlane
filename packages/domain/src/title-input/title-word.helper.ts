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
