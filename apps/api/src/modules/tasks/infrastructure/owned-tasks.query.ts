import type { Label, Project, Task } from '@soonlane/contracts'
import { label, project, task, taskLabel, type TaskRow } from '@soonlane/db'
import {
	type LabelId,
	type ProjectId,
	TASK_COMPLETED_ORDER,
	TASK_DAY_ORDER,
	type TaskCompletedOrderKey,
	type TaskDayOrderKey,
	type TaskId,
	type UserId,
} from '@soonlane/domain'
import { and, asc, desc, eq, inArray, type SQL, sql } from 'drizzle-orm'
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core'
import { labelOrder } from '@/modules/labels/infrastructure/label-order.query'
import { toLabel } from '@/modules/labels/infrastructure/label.mapper'
import { toProject } from '@/modules/projects/infrastructure/project.mapper'
import type { Database } from '@/platform/db/db.layer'
import { toTask } from './task.mapper'

/** The pool handle or a transaction: everything `ownedTasks` runs on. */
export type Queries = Pick<
	Database,
	'$count' | 'delete' | 'insert' | 'select' | 'update'
>

const DAY_ORDER_SQL: Record<TaskDayOrderKey, SQL> = {
	dueDate: asc(task.dueDate),
	dueTime: sql`${task.dueTime} asc nulls last`,
	priority: asc(task.priority),
	createdAt: asc(task.createdAt),
}
const COMPLETED_ORDER_SQL: Record<TaskCompletedOrderKey, SQL> = {
	completedAt: desc(task.completedAt),
	createdAt: desc(task.createdAt),
}

export const DAY_ORDER = TASK_DAY_ORDER.map(key => DAY_ORDER_SQL[key])
export const COMPLETED_ORDER = TASK_COMPLETED_ORDER.map(
	key => COMPLETED_ORDER_SQL[key]
)

/**
 * The owner condition every query on the task table carries. Only this file reads `task.ownerId`, and only this file
 * and the allowlisted single statements query the table (`soonlane/task-owner-scope`).
 */
export function ownedBy(ownerId: UserId) {
	return eq(task.ownerId, ownerId)
}

/**
 * Task queries bound to one owner on one handle (the pool or a transaction), so no query can leave out the owner
 * filter. Every `where` passed in is added to the owner condition, never replaces it.
 */
export function ownedTasks(database: Queries, ownerId: UserId) {
	const owned = ownedBy(ownerId)
	const select = (where?: SQL) =>
		database.select().from(task).where(and(owned, where))

	/** The tasks with their labels and their project, each read in one query for all rows. */
	async function withLabelsAndProject(rows: TaskRow[]): Promise<Task[]> {
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

		const projectIds = rows.flatMap(row => row.projectId ?? [])
		const projects =
			projectIds.length === 0
				? []
				: await database
						.select()
						.from(project)
						.where(
							and(eq(project.ownerId, ownerId), inArray(project.id, projectIds))
						)
		const projectsById = new Map<ProjectId | null, Project>(
			projects.map(row => [row.id, toProject(row)])
		)

		return rows.map(row =>
			toTask(
				row,
				labelsByTask.get(row.id) ?? [],
				projectsById.get(row.projectId)
			)
		)
	}

	return {
		withLabelsAndProject,
		/** The owner's tasks matching `where`, with their labels, in day order unless `order` says otherwise. */
		list: async (where?: SQL, order: SQL[] = DAY_ORDER, limit?: number) => {
			const ordered = select(where).orderBy(...order)

			return await withLabelsAndProject(
				await (limit === undefined ? ordered : ordered.limit(limit))
			)
		},
		find: async (id: TaskId) => {
			const [found] = await withLabelsAndProject(await select(eq(task.id, id)))

			return found
		},
		count: async () => await database.$count(task, owned),
		/** An `UPDATE` of the owner's tasks matching `where`; the caller picks what it returns. */
		update: (set: PgUpdateSetSource<typeof task>, where: SQL | undefined) =>
			database.update(task).set(set).where(and(owned, where)),
		/** A `DELETE` of the owner's tasks matching `where`; the caller picks what it returns. */
		delete: (where: SQL | undefined) =>
			database.delete(task).where(and(owned, where)),
		/** Adds labels to a task; inserts nothing for a label or a task that does not belong to the owner. */
		assignLabels: async (id: TaskId, labelIds: LabelId[]) => {
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
						.where(and(owned, eq(task.id, id)))
				)
				.onConflictDoNothing()
		},
		/** Takes a label off a task; deletes nothing for a task that does not belong to the owner. */
		unassignLabel: async (id: TaskId, labelId: LabelId) => {
			await database.delete(taskLabel).where(
				and(
					eq(taskLabel.labelId, labelId),
					inArray(
						taskLabel.taskId,
						database
							.select({ id: task.id })
							.from(task)
							.where(and(owned, eq(task.id, id)))
					)
				)
			)
		},
	}
}
