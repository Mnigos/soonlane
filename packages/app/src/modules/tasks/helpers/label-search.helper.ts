import type { Label } from '@soonlane/contracts'
import { filterByName, isNamed } from './task-view.helper'

/** The "Create label" row is a label with this id, so the arrow keys and Enter reach it. */
export const NEW_LABEL_ID = 'new'

/** The labels whose name holds `query` (ignoring case), then a "Create label" row unless one has that very name. */
export function searchLabels(labels: Label[], query: string) {
	const name = query.trim()
	const matches = filterByName(labels, name)
	const isNewName = name !== '' && !labels.some(label => isNamed(label, name))

	return {
		name,
		matches,
		isNewName,
		items: isNewName ? [...matches, { id: NEW_LABEL_ID, name }] : matches,
	}
}
