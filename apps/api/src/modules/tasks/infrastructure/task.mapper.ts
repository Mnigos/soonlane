import type { Label, Project, Task } from '@soonlane/contracts'
import type { TaskRow } from '@soonlane/db'

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
		dueDate: row.dueDate,
		dueTime: row.dueTime?.slice(0, DUE_TIME_LENGTH),
		priority: row.priority,
		createdAt: row.createdAt,
		completedAt: row.completedAt ?? undefined,
		repeat: unit && interval && anchor ? { unit, interval, anchor } : undefined,
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
