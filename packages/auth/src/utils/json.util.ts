/** `JSON.parse` that answers `undefined` for text that is not JSON, so a corrupt stored value is refused like a missing one. */
export function parseJson(text: string): unknown {
	try {
		return JSON.parse(text)
	} catch {
		return undefined
	}
}
