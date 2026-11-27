/** A run of a task's description: plain text, or a web address with its `href`. */
export interface DescriptionPart {
	text: string
	href?: string
}

const URL_SPLIT_PATTERN = /(https?:\/\/[^\s<>"]+)/u
/** Punctuation that ends a sentence rather than the address, as in "see https://example.com." */
const TRAILING_PUNCTUATION = /[.,;:!?\]}'"]$/u

function countOf(text: string, character: string) {
	return text.split(character).length - 1
}

/** Drops sentence punctuation from the end, and a ")" only when it closes nothing in the address, as in "(see https://example.com)". */
function trimAddress(address: string): string {
	const isUnbalancedParen =
		address.endsWith(')') && countOf(address, ')') > countOf(address, '(')

	return TRAILING_PUNCTUATION.test(address) || isUnbalancedParen
		? trimAddress(address.slice(0, -1))
		: address
}

function toParts(chunk: string, index: number): DescriptionPart[] {
	// split with a capture group puts the addresses at the odd indexes.
	if (index % 2 === 0) return chunk ? [{ text: chunk }] : []

	const href = trimAddress(chunk)
	const rest = chunk.slice(href.length)

	return rest ? [{ text: href, href }, { text: rest }] : [{ text: href, href }]
}

/** Splits a description into text and the http(s) addresses in it, so they can render as links. */
export function splitDescriptionLinks(description: string) {
	return description.split(URL_SPLIT_PATTERN).flatMap(toParts)
}
