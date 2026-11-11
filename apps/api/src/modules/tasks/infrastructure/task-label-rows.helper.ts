import type { Label, Task } from '@soonlane/contracts'
import { label, task, taskLabel, type TaskRow } from '@soonlane/db'
import type { LabelId, TaskId, UserId } from '@soonlane/domain'
import { and, eq, inArray } from 'drizzle-orm'
import {
	labelOrder,
	toLabel,
} from '@/modules/labels/infrastructure/label-row.helper'
import type { Database } from '@/platform/db/db.layer'
import { toTask } from './task-row.helper'

export type Queries = Pick<Database, 'insert' | 'select'>

/** The tasks with their labels, read in one query for all rows. */
export async function withLabels(
	database: Queries,
	ownerId: UserId,
	rows: TaskRow[]
): Promise<Task[]> {
	if (rows.length === 0) return []

	const assigned = await database
		.select({ taskId: taskLabel.taskId, label })
		.from(taskLabel)
		.innerJoin(label, eq(label.id, taskLabel.labelId))
		.where(
			and(
				eq(label.ownerId, ownerId),
				inArray(
					taskLabel.taskId,
					rows.map(row => row.id)
				)
			)
		)
		.orderBy(...labelOrder)
	const labelsByTask = new Map<TaskId, Label[]>()

	for (const { taskId, label: labelRow } of assigned) {
		const labels = labelsByTask.get(taskId) ?? []

		if (labels.length === 0) labelsByTask.set(taskId, labels)
		labels.push(toLabel(labelRow))
	}

	return rows.map(row => toTask(row, labelsByTask.get(row.id) ?? []))
}

/** Adds labels to a task; inserts nothing for a label or a task that does not belong to the owner. */
export async function assignLabels(
	database: Queries,
	ownerId: UserId,
	id: TaskId,
	labelIds: LabelId[]
) {
	await database
		.insert(taskLabel)
		.select(
			database
				.select({ taskId: task.id, labelId: label.id })
				.from(task)
				.innerJoin(
					label,
					and(eq(label.ownerId, ownerId), inArray(label.id, labelIds))
				)
				.where(and(eq(task.ownerId, ownerId), eq(task.id, id)))
		)
		.onConflictDoNothing()
}
