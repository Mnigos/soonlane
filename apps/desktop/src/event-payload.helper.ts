// Electrobun types event payloads as unknown; these read them without type assertions.

export function readField(value: unknown, key: string): unknown {
	if (typeof value !== 'object' || value === null) return undefined

	return Object.entries(value).find(([name]) => name === key)?.[1]
}

/** `event.data[key]` as a string, e.g. a navigation's `detail` or a menu item's `action`. */
export function readEventString(event: unknown, key: string) {
	const value = readField(readField(event, 'data'), key)

	return typeof value === 'string' ? value : undefined
}

/** The URL of a new-window-open event; its detail is a JSON object or, from older bridges, the bare URL. */
export function readNewWindowUrl(event: unknown) {
	const detail = readField(readField(event, 'data'), 'detail')
	const url = typeof detail === 'string' ? detail : readField(detail, 'url')

	return typeof url === 'string' ? url : undefined
}

function parseJson(text: string): unknown {
	try {
		return JSON.parse(text)
	} catch {
		return undefined
	}
}

/** A will-navigate event's detail is JSON: `{ url, allowed }`, where `allowed` is the navigation rules' verdict. */
export function readBlockedNavigationUrl(event: unknown) {
	const detail = readEventString(event, 'detail')
	const navigation = detail === undefined ? undefined : parseJson(detail)
	const url = readField(navigation, 'url')

	return readField(navigation, 'allowed') === false && typeof url === 'string'
		? url
		: undefined
}
