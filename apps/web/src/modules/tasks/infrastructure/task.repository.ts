import type { GoalInput } from '@soonlane/contracts'
import { label, task, taskLabel } from '@soonlane/db'
import {
	DEFAULT_TASK_PRIORITY,
	type TaskId,
	type UserId,
} from '@soonlane/domain'
import {
	and,
	asc,
	between,
	desc,
	eq,
	gte,
	inArray,
	isNotNull,
	isNull,
	lt,
	sql,
} from 'drizzle-orm'
import { Effect, Layer } from 'effect'
import { toLabel } from '@/modules/labels/infrastructure/label-row.helper'
import { Db } from '@/platform/db/db.layer'
import { TaskRepository } from '../application/task-repository.port'
import {
	assignLabels,
	type Queries,
	withLabels,
} from './task-label-rows.helper'
import { updateProgress } from './task-progress.helper'
import { toTask } from './task-row.helper'
import { updateTask } from './task-update.helper'

// Keep in sync with compareTasks in task-list.helper.ts.
const DAY_ORDER = [
	asc(task.dueDate),
	sql`${task.dueTime} asc nulls last`,
	asc(task.priority),
	asc(task.createdAt),
]

/** Clamped to the restored goal's target, or to the stored one; a task without a goal keeps 0, which its check requires. */
function getRestoredProgress(
	progress: number | undefined,
	goal: GoalInput | undefined
) {
	if (goal && progress !== undefined) return Math.min(progress, goal.target)
	if (goal) return sql`least(${task.goalProgress}, ${goal.target})`
	if (progress === undefined) return undefined

	return sql`least(${progress}, coalesce(${task.goalTarget}, 0))`
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
			listCompletedBetween: ({ ownerId, from, to }) =>
				db.run('TaskRepository.listCompletedBetween', async database => {
					const rows = await database
						.select()
						.from(task)
						.where(
							and(
								eq(task.ownerId, ownerId),
								gte(task.completedAt, from),
								lt(task.completedAt, to)
							)
						)
						// Keep in sync with compareCompleted in task-completion.helper.ts.
						.orderBy(desc(task.completedAt), desc(task.createdAt))

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
			update: update =>
				db.run(
					'TaskRepository.update',
					async database =>
						await database.transaction(
							async transaction => await updateTask(transaction, update)
						)
				),
			delete: ({ ownerId, id }) =>
				db.run('TaskRepository.delete', async database => {
					const [row] = await database
						.delete(task)
						.where(and(eq(task.ownerId, ownerId), eq(task.id, id)))
						.returning({ id: task.id })

					return row?.id
				}),
			count: ownerId =>
				db.run(
					'TaskRepository.count',
					async database =>
						await database.$count(task, eq(task.ownerId, ownerId))
				),
			setCompletion: ({ ownerId, id, completedAt, dueDate, progress, goal }) =>
				db.run('TaskRepository.setCompletion', async database => {
					const rows = await database
						.update(task)
						.set({
							completedAt: completedAt ?? null,
							dueDate,
							...(goal && {
								goalTarget: goal.target,
								goalUnit: goal.unit ?? null,
							}),
							goalProgress: getRestoredProgress(progress, goal),
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
				db.run(
					'TaskRepository.logProgress',
					async database =>
						await database.transaction(async transaction => {
							const row = await updateProgress(transaction, log)

							if (!row) return undefined

							const [logged] = await withLabels(transaction, log.ownerId, [row])
							const completed = row.completed
								? {
										dueDate: row.previousDueDate,
										progress: row.previousProgress,
									}
								: undefined

							return logged && { task: logged, logged: row.logged, completed }
						})
				),
		})
	})
)
