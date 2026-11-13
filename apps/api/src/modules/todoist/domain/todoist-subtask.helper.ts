import { SUBTASK_DEPTH_MAX, SUBTASKS_PER_TASK_MAX } from '@soonlane/domain'
import type { TodoistItem } from './todoist-snapshot.schemas'

/** Where an imported item lands: under `parent` at `depth`, or top level without one; `root` is its top-level item. */
export interface ItemPlacement {
	item: TodoistItem
	parent?: ItemPlacement
	depth: number
	root: TodoistItem
}

function toTopLevel(item: TodoistItem): ItemPlacement {
	return { item, depth: 0, root: item }
}

/**
 * The items as a tree Soonlane can hold, parents before their children. An item
 * whose parent is not among `items` stays top level, one below the deepest level
 * goes under its ancestor a level above the deepest, and a task keeps its first
 * 50 subtasks (direct children first, in snapshot order) while the rest arrive
 * top level, as does an item in a parent loop.
 */
export function placeTodoistItems(items: readonly TodoistItem[]) {
	const ids = new Set(items.map(item => item.id))
	const childrenByParent = new Map<string, TodoistItem[]>()

	for (const item of items)
		if (item.parent_id && ids.has(item.parent_id)) {
			const siblings = childrenByParent.get(item.parent_id)

			if (siblings) siblings.push(item)
			else childrenByParent.set(item.parent_id, [item])
		}

	const placements = items
		.filter(item => !(item.parent_id && ids.has(item.parent_id)))
		.map(toTopLevel)
	const subtaskCounts = new Map<ItemPlacement, number>()

	// Iterating while pushing walks the tree level by level.
	for (const placement of placements)
		for (const child of childrenByParent.get(placement.item.id) ?? []) {
			const parent =
				placement.depth < SUBTASK_DEPTH_MAX ? placement : placement.parent
			const count = parent ? (subtaskCounts.get(parent) ?? 0) : 0

			if (parent && count < SUBTASKS_PER_TASK_MAX) {
				subtaskCounts.set(parent, count + 1)
				placements.push({
					item: child,
					parent,
					depth: parent.depth + 1,
					root: parent.root,
				})
			} else placements.push(toTopLevel(child))
		}

	const placed = new Set(placements.map(({ item }) => item.id))

	return [
		...placements,
		...items.filter(item => !placed.has(item.id)).map(toTopLevel),
	]
}
