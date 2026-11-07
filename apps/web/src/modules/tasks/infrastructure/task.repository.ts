import type { Label, Task } from '@soonlane/contracts'
import { label, task, taskLabel, type TaskRow } from '@soonlane/db'
import {
	DEFAULT_TASK_PRIORITY,
	type LabelId,
	type TaskId,
	type UserId,
} from '@soonlane/domain'
import {
	and,
	asc,
	between,
	eq,
	inArray,
	isNotNull,
	isNull,
	lt,
	sql,
} from 'drizzle-orm'
import { Effect, Layer } from 'effect'
import {
	labelOrder,
	toLabel,
} from '@/modules/labels/infrastructure/label-row.helper'
import { Db, type Database } from '@/platform/db/db.layer'
import { TaskRepository } from '../application/task-repository.port'
import { updateProgress } from './task-progress.helper'
import { toTask } from './task-row.helper'

type Queries = Pick<Database, 'insert' | 'select'>

// Keep in sync with compareTasks in task-list.helper.ts.
const DAY_ORDER = [
	asc(task.dueDate),
	sql`${task.dueTime} asc nulls last`,
	asc(task.priority),
	asc(task.createdAt),
]

async function withLabels(
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

// Inserts nothing for a label or a task that does not belong to the owner.
async function assignLabels(
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

async function findTask(database: Queries, ownerId: UserId, id: TaskId) {
	const rows = await database
		.select()
		.from(task)
		.where(and(eq(task.ownerId, ownerId), eq(task.id, id)))
	const [found] = await withLabels(database, ownerId, rows)

	return found
}

export const DrizzleTaskRepositoryLive = Layer.effect(
	TaskRepository,
	Effect.gen(function* () {
		const db = yield* Db

		return TaskRepository.of({
			listOpenBetween: ({ ownerId, from, to }) =>
				db.run('TaskRepository.listOpenBetween', async database => {
					const rows = await database
						.select()
						.from(task)
						.where(
							and(
								eq(task.ownerId, ownerId),
								isNull(task.completedAt),
								between(task.dueDate, from, to)
							)
						)
						.orderBy(...DAY_ORDER)

					return await withLabels(database, ownerId, rows)
				}),
			listOpenBefore: ({ ownerId, before }) =>
				db.run('TaskRepository.listOpenBefore', async database => {
					const rows = await database
						.select()
						.from(task)
						.where(
							and(
								eq(task.ownerId, ownerId),
								isNull(task.completedAt),
								lt(task.dueDate, before)
							)
						)
						.orderBy(...DAY_ORDER)

					return await withLabels(database, ownerId, rows)
				}),
			listOpenWithLabel: ({ ownerId, labelId }) =>
				db.run('TaskRepository.listOpenWithLabel', async database => {
					const rows = await database
						.select()
						.from(task)
						.where(
							and(
								eq(task.ownerId, ownerId),
								isNull(task.completedAt),
								inArray(
									task.id,
									database
										.select({ id: taskLabel.taskId })
										.from(taskLabel)
										.where(eq(taskLabel.labelId, labelId))
								)
							)
						)
						.orderBy(...DAY_ORDER)

					return await withLabels(database, ownerId, rows)
				}),
			find: ({ ownerId, id }) =>
				db.run(
					'TaskRepository.find',
					async database => await findTask(database, ownerId, id)
				),
			create: ({
				ownerId,
				title,
				description,
				dueDate,
				dueTime,
				priority,
				repeat,
				labelIds = [],
				goal,
			}) =>
				db.run(
					'TaskRepository.create',
					async database =>
						await database.transaction(async transaction => {
							const [row] = await transaction
								.insert(task)
								.values({
									ownerId,
									title,
									description: description || null,
									dueDate,
									dueTime: dueTime ?? null,
									priority: priority ?? DEFAULT_TASK_PRIORITY,
									repeatUnit: repeat?.unit ?? null,
									repeatInterval: repeat?.interval ?? null,
									repeatAnchor: repeat?.anchor ?? null,
									goalTarget: goal?.target ?? null,
									goalUnit: goal?.unit ?? null,
								})
								.returning()

							if (!row) throw new Error('Task insert returned no row')
							if (labelIds.length === 0) return toTask(row, [])

							await assignLabels(transaction, ownerId, row.id, labelIds)
							const [created] = await withLabels(transaction, ownerId, [row])

							return created ?? toTask(row, [])
						})
				),
			update: ({
				ownerId,
				id,
				title,
				description,
				dueDate,
				dueTime,
				priority,
				repeat,
			}) =>
				db.run('TaskRepository.update', async database => {
					const rows = await database
						.update(task)
						.set({
							title,
							description: description || null,
							dueDate,
							dueTime: dueTime ?? null,
							priority,
							repeatUnit: repeat?.unit ?? null,
							repeatInterval: repeat?.interval ?? null,
							repeatAnchor: repeat?.anchor ?? null,
						})
						.where(and(eq(task.ownerId, ownerId), eq(task.id, id)))
						.returning()
					const [updated] = await withLabels(database, ownerId, rows)

					return updated
				}),
			count: ownerId =>
				db.run(
					'TaskRepository.count',
					async database =>
						await database.$count(task, eq(task.ownerId, ownerId))
				),
			setCompletion: ({ ownerId, id, completedAt, dueDate, progress }) =>
				db.run('TaskRepository.setCompletion', async database => {
					const rows = await database
						.update(task)
						.set({
							completedAt: completedAt ?? null,
							dueDate,
							// A task without a goal keeps 0, which its check requires.
							goalProgress:
								progress === undefined
									? undefined
									: sql`least(${progress}, coalesce(${task.goalTarget}, 0))`,
						})
						.where(and(eq(task.ownerId, ownerId), eq(task.id, id)))
						.returning()
					const [updated] = await withLabels(database, ownerId, rows)

					return updated
				}),
			advanceDueDate: ({ ownerId, id, from, to }) =>
				db.run('TaskRepository.advanceDueDate', async database => {
					const rows = await database
						.update(task)
						.set({ dueDate: to, goalProgress: 0 })
						.where(
							and(
								eq(task.ownerId, ownerId),
								eq(task.id, id),
								eq(task.dueDate, from),
								isNotNull(task.repeatUnit)
							)
						)
						.returning()
					const [advanced] = await withLabels(database, ownerId, rows)

					return advanced
				}),
			rescheduleOpen: ({ ownerId, ids, dueDate }) =>
				db.run('TaskRepository.rescheduleOpen', async database => {
					const rows = await database
						.update(task)
						.set({ dueDate })
						.where(
							and(
								eq(task.ownerId, ownerId),
								inArray(task.id, ids),
								isNull(task.completedAt)
							)
						)
						.returning()

					return await withLabels(database, ownerId, rows)
				}),
			findLabel: ({ ownerId, labelId }) =>
				db.run('TaskRepository.findLabel', async database => {
					const [row] = await database
						.select()
						.from(label)
						.where(and(eq(label.ownerId, ownerId), eq(label.id, labelId)))

					return row && toLabel(row)
				}),
			assignLabel: ({ ownerId, id, labelId }) =>
				db.run('TaskRepository.assignLabel', async database => {
					await assignLabels(database, ownerId, id, [labelId])

					return await findTask(database, ownerId, id)
				}),
			unassignLabel: ({ ownerId, id, labelId }) =>
				db.run('TaskRepository.unassignLabel', async database => {
					await database.delete(taskLabel).where(
						and(
							eq(taskLabel.labelId, labelId),
							inArray(
								taskLabel.taskId,
								database
									.select({ id: task.id })
									.from(task)
									.where(and(eq(task.ownerId, ownerId), eq(task.id, id)))
							)
						)
					)

					return await findTask(database, ownerId, id)
				}),
			logProgress: log =>
				db.run('TaskRepository.logProgress', async database => {
					const row = await updateProgress(database, log)

					if (!row) return undefined

					const [logged] = await withLabels(database, log.ownerId, [row])
					const completed = row.completed
						? { dueDate: row.previousDueDate, progress: row.previousProgress }
						: undefined

					return logged && { task: logged, logged: row.logged, completed }
				}),
		})
	})
)
