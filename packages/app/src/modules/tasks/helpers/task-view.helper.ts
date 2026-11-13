/** Label and project names are unique per owner ignoring case, so a view's `$name` matches any casing. */
export function isNamed(item: { name: string }, name: string | undefined) {
	return name?.toLowerCase() === item.name.toLowerCase()
}

/** The items whose name holds `query`, ignoring case. */
export function filterByName<T extends { name: string }>(
	items: readonly T[],
	query: string
) {
	const search = query.toLowerCase()

	return items.filter(item => item.name.toLowerCase().includes(search))
}

/** A view's tab title: the item's name, a not-found title once the list loaded without it, or the URL's name while it loads. */
export function getTaskViewTitle(
	items: { name: string }[] | undefined,
	name: string,
	notFoundTitle: string
) {
	if (!items) return name

	return items.find(item => isNamed(item, name))?.name ?? notFoundTitle
}
