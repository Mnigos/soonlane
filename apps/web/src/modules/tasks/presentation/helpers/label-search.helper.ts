import type { Label } from '@soonlane/contracts'

/** The "Create label" row is a label with this id, so the arrow keys and Enter reach it. */
export const NEW_LABEL_ID = 'new'

/** The labels whose name holds `query` (ignoring case), then a "Create label" row unless one has that very name. */
export function searchLabels(labels: Label[], query: string) {
	const name = query.trim()
	const search = name.toLowerCase()
	const matches = labels.filter(label =>
		label.name.toLowerCase().includes(search)
	)
	const isNewName =
		name !== '' && !labels.some(label => label.name.toLowerCase() === search)

	return {
		name,
		matches,
		isNewName,
		items: isNewName ? [...matches, { id: NEW_LABEL_ID, name }] : matches,
	}
}
