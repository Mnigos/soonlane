import { filterByName, isNamed } from './task-view.helper'

/** A picker's "Create" row is an item with this id, so the arrow keys and Enter reach it. */
export const NEW_ITEM_ID = 'new'

/** The items whose name holds `query` (ignoring case), then a "Create" row unless one has that very name. */
export function searchByName<TItem extends { id: string; name: string }>(
	items: TItem[],
	query: string
) {
	const name = query.trim()
	const matches = filterByName(items, name)
	const isNewName = name !== '' && !items.some(item => isNamed(item, name))

	return {
		name,
		matches,
		isNewName,
		items: isNewName ? [...matches, { id: NEW_ITEM_ID, name }] : matches,
	}
}
