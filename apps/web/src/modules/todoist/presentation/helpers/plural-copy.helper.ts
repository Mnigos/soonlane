/** `{count}` stands for the number; `one` is used for exactly 1. */
export interface PluralCopy {
	one: string
	other: string
}

const countFormat = new Intl.NumberFormat('en')

export function formatCount(count: number, copy: PluralCopy) {
	return (count === 1 ? copy.one : copy.other).replace(
		'{count}',
		countFormat.format(count)
	)
}
