import type { Label, Task } from '@soonlane/contracts'
import { label, task, taskLabel, type TaskRow } from '@soonlane/db'
import {
	DEFAULT_TASK_PRIORITY,
	type TaskId,
	toCalendarDate,
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
	or,
	sql,
} from 'drizzle-orm'
import { Effect, Layer } from 'effect'
import {
	LABEL_ORDER,
	toLabel,
} from '@/modules/labels/infrastructure/label-row.helper'
import { Db, type Database } from '@/platform/db/db.layer'
import { TaskRepository } from '../application/task-repository.port'

// Postgres returns time(0) as HH:MM:SS; the contract carries HH:MM.
const DUE_TIME_LENGTH = 5

// Timed tasks first by time, then by priority (P1 first), then oldest first.
const DAY_ORDER = [
	asc(task.dueDate),
	sql`${task.dueTime} asc nulls last`,
	asc(task.priority),
	asc(task.createdAt),
]

function toTask(row: TaskRow, labels: Label[]): Task {
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
	}
}

// One query loads the labels of every row, however many tasks there are.
async function withLabels(
	database: Database,
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
		.orderBy(...LABEL_ORDER)
	const labelsByTask = new Map<TaskId, Label[]>()

	for (const { taskId, label: labelRow } of assigned) {
		const labels = labelsByTask.get(taskId) ?? []

		if (labels.length === 0) labelsByTask.set(taskId, labels)
		labels.push(toLabel(labelRow))
	}

	return rows.map(row => toTask(row, labelsByTask.get(row.id) ?? []))
}

async function findTask(database: Database, ownerId: UserId, id: TaskId) {
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
			listOpen: ({ ownerId, before, from, to }) =>
				db.run('TaskRepository.listOpen', async database => {
					const rows = await database
						.select()
						.from(task)
						.where(
							and(
								eq(task.ownerId, ownerId),
								isNull(task.completedAt),
								or(lt(task.dueDate, before), between(task.dueDate, from, to))
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
			}) =>
				db.run('TaskRepository.create', async database => {
					const [row] = await database
						.insert(task)
						.values({
							ownerId,
							title,
							description: description || null,
							dueDate: toCalendarDate(dueDate),
							dueTime: dueTime ?? null,
							priority: priority ?? DEFAULT_TASK_PRIORITY,
							repeatUnit: repeat?.unit ?? null,
							repeatInterval: repeat?.interval ?? null,
							repeatAnchor: repeat?.anchor ?? null,
						})
						.returning()

					if (!row) throw new Error('Task insert returned no row')

					return toTask(row, [])
				}),
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
							dueDate: toCalendarDate(dueDate),
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
			setCompletion: ({ ownerId, id, completedAt, dueDate }) =>
				db.run('TaskRepository.setCompletion', async database => {
					const rows = await database
						.update(task)
						.set({ completedAt: completedAt ?? null, dueDate })
						.where(and(eq(task.ownerId, ownerId), eq(task.id, id)))
						.returning()
					const [updated] = await withLabels(database, ownerId, rows)

					return updated
				}),
			advanceDueDate: ({ ownerId, id, from, to }) =>
				db.run('TaskRepository.advanceDueDate', async database => {
					const rows = await database
						.update(task)
						.set({ dueDate: to })
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
			labelExists: ({ ownerId, labelId }) =>
				db.run('TaskRepository.labelExists', async database => {
					const [row] = await database
						.select({ id: label.id })
						.from(label)
						.where(and(eq(label.ownerId, ownerId), eq(label.id, labelId)))

					return row !== undefined
				}),
			// Inserts nothing unless both the task and the label belong to the owner.
			assignLabel: ({ ownerId, id, labelId }) =>
				db.run('TaskRepository.assignLabel', async database => {
					await database
						.insert(taskLabel)
						.select(
							database
								.select({ taskId: task.id, labelId: label.id })
								.from(task)
								.innerJoin(
									label,
									and(eq(label.ownerId, ownerId), eq(label.id, labelId))
								)
								.where(and(eq(task.ownerId, ownerId), eq(task.id, id)))
						)
						.onConflictDoNothing()

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
		})
	})
)
