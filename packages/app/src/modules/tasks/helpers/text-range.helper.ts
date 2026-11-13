export interface TextRange {
	start: number
	end: number
}

/** `text` cut into pieces at non-overlapping `ranges`, in order; `isRange` marks the ranges' own pieces. */
export function splitByRanges(text: string, ranges: TextRange[]) {
	const sorted = ranges.toSorted((a, b) => a.start - b.start)
	const pieces = [
		...sorted.flatMap(({ start, end }, index) => [
			{ start: sorted[index - 1]?.end ?? 0, end: start, isRange: false },
			{ start, end, isRange: true },
		]),
		{ start: sorted.at(-1)?.end ?? 0, end: text.length, isRange: false },
	]

	return pieces.map(piece => ({
		...piece,
		text: text.slice(piece.start, piece.end),
	}))
}
