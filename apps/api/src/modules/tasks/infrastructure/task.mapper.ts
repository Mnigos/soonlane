import type { Label, Project, Task } from '@soonlane/contracts'
import type { TaskRow } from '@soonlane/db'
import type { RepeatRule } from '@soonlane/domain'

/** Postgres returns time(0) as HH:MM:SS; the contract carries HH:MM. */
const DUE_TIME_LENGTH = 5

export function toTask(row: TaskRow, labels: Label[], project?: Project): Task {
	const {
		repeatUnit: unit,
		repeatInterval: interval,
		repeatAnchor: anchor,
	} = row

	return {
		id: row.id,
		title: row.title,
		description: row.description ?? undefined,
		dueDate: row.dueDate ?? undefined,
		dueTime: row.dueTime?.slice(0, DUE_TIME_LENGTH),
		priority: row.priority,
		createdAt: row.createdAt,
		completedAt: row.completedAt ?? undefined,
		repeat:
			unit && interval && anchor
				? { unit, interval, anchor, fromCompletion: row.repeatFromCompletion }
				: undefined,
		labels,
		project,
		goal:
			row.goalTarget === null
				? undefined
				: {
						target: row.goalTarget,
						unit: row.goalUnit ?? undefined,
						progress: row.goalProgress,
					},
	}
}

/** The repeat columns a write sets; no rule clears them all, as the checks require. */
export function toRepeatColumns(repeat: RepeatRule | undefined) {
	return {
		repeatUnit: repeat?.unit ?? null,
		repeatInterval: repeat?.interval ?? null,
		repeatAnchor: repeat?.anchor ?? null,
		repeatFromCompletion: repeat?.fromCompletion ?? false,
	}
}
