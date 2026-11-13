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
import {
	and,
	asc,
	count,
	desc,
	eq,
	inArray,
	isNotNull,
	isNull,
	lt,
	max,
	or,
	type SQL,
	sql,
} from 'drizzle-orm'
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

/** Tasks an open list shows: top-level ones and dated subtasks; an undated subtask shows only under its parent. */
export const SHOWN_IN_LISTS = or(isNull(task.parentId), isNotNull(task.dueDate))

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

	/** The tasks with their labels, project, parent and subtask counts, each read in one query for all rows. */
	async function withRelations(rows: TaskRow[]): Promise<Task[]> {
		if (rows.length === 0) return []

		const ids = rows.map(row => row.id)
		const assigned = await database
			.select({ taskId: taskLabel.taskId, label })
			.from(taskLabel)
			.innerJoin(label, eq(label.id, taskLabel.labelId))
			.where(and(eq(label.ownerId, ownerId), inArray(taskLabel.taskId, ids)))
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
		const parentIds = rows.flatMap(row => row.parentId ?? [])
		const parents =
			parentIds.length === 0
				? []
				: await database
						.select({ id: task.id, title: task.title })
						.from(task)
						.where(and(owned, inArray(task.id, parentIds)))
		const parentsById = new Map<TaskId | null, Task['parent']>(
			parents.map(parent => [parent.id, parent])
		)
		const subtaskCounts = await database
			.select({
				parentId: task.parentId,
				done: count(task.completedAt),
				total: count(),
			})
			.from(task)
			.where(and(owned, inArray(task.parentId, ids)))
			.groupBy(task.parentId)
		const subtasksByTask = new Map<TaskId | null, Task['subtasks']>(
			subtaskCounts.map(({ parentId, ...subtasks }) => [parentId, subtasks])
		)

		return rows.map(row =>
			toTask(row, {
				labels: labelsByTask.get(row.id) ?? [],
				project: projectsById.get(row.projectId),
				parent: parentsById.get(row.parentId),
				subtasks: subtasksByTask.get(row.id),
			})
		)
	}

	/** The ids of the task's subtasks at every level below it. */
	const descendantsOf = (id: TaskId) => sql`(
		with recursive subtree(id) as (
			select ${task.id} from ${task} where ${owned} and ${task.parentId} = ${id}
			union
			select child.id from ${task} child
			inner join subtree on child.parent_id = subtree.id
			where child.owner_id = ${ownerId}
		)
		select id from subtree
	)`
	/** The ids of the tasks and of every task above them. */
	const lineageOf = (ids: TaskId[]) => sql`(
		with recursive lineage(id, parent_id) as (
			select ${task.id}, ${task.parentId} from ${task} where ${owned} and ${inArray(task.id, ids)}
			union
			select ancestor.id, ancestor.parent_id from ${task} ancestor
			inner join lineage on ancestor.id = lineage.parent_id
			where ancestor.owner_id = ${ownerId}
		)
		select id from lineage
	)`

	/** Locks the tasks and their ancestors by depth, then id: the one order every locker takes, so lockers never deadlock. */
	const lockPaths = async (ids: TaskId[]) =>
		await select(inArray(task.id, lineageOf(ids)))
			.orderBy(asc(task.depth), asc(task.id))
			.for('update')

	return {
		withRelations,
		descendantsOf,
		lineageOf,
		/** The owner's tasks matching `where`, with their labels, in day order unless `order` says otherwise. */
		list: async (where?: SQL, order: SQL[] = DAY_ORDER, limit?: number) => {
			const ordered = select(where).orderBy(...order)

			return await withRelations(
				await (limit === undefined ? ordered : ordered.limit(limit))
			)
		},
		find: async (id: TaskId) => {
			const [found] = await withRelations(await select(eq(task.id, id)))

			return found
		},
		lockPaths,
		/**
		 * Locks the task and its ancestors, root first, and returns the task's row. Every write that can reach other tasks of a tree
		 * takes this lock first, so writes in one tree queue on its root's row and never deadlock.
		 */
		lockPath: async (id: TaskId) => {
			const rows = await lockPaths([id])

			return rows.find(row => row.id === id)
		},
		count: async (where?: SQL) =>
			await database.$count(task, and(owned, where)),
		latestCompletedBefore: async (before: Date) => {
			const [row] = await database
				.select({ completedAt: max(task.completedAt) })
				.from(task)
				.where(and(owned, lt(task.completedAt, before)))

			return row?.completedAt ?? undefined
		},
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

export type OwnedTasks = ReturnType<typeof ownedTasks>
