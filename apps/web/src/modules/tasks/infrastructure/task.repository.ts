import type { Task } from '@soonlane/contracts'
import { task, type TaskRow } from '@soonlane/db'
import { DEFAULT_TASK_PRIORITY, toCalendarDate } from '@soonlane/domain'
import { and, asc, between, eq, inArray, isNull, lt, sql } from 'drizzle-orm'
import { Effect, Layer } from 'effect'
import { Db } from '@/platform/db/db.layer'
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

function toTask(row: TaskRow): Task {
	return {
		id: row.id,
		title: row.title,
		description: row.description ?? undefined,
		dueDate: row.dueDate,
		dueTime: row.dueTime?.slice(0, DUE_TIME_LENGTH),
		priority: row.priority,
		createdAt: row.createdAt,
		completedAt: row.completedAt ?? undefined,
	}
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

					return rows.map(toTask)
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

					return rows.map(toTask)
				}),
			create: ({ ownerId, title, description, dueDate, dueTime, priority }) =>
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
						})
						.returning()

					if (!row) throw new Error('Task insert returned no row')

					return toTask(row)
				}),
			update: ({
				ownerId,
				id,
				title,
				description,
				dueDate,
				dueTime,
				priority,
			}) =>
				db.run('TaskRepository.update', async database => {
					const [row] = await database
						.update(task)
						.set({
							title,
							description: description || null,
							dueDate: toCalendarDate(dueDate),
							dueTime: dueTime ?? null,
							priority,
						})
						.where(and(eq(task.ownerId, ownerId), eq(task.id, id)))
						.returning()

					return row && toTask(row)
				}),
			setCompletion: ({ ownerId, id, completedAt }) =>
				db.run('TaskRepository.setCompletion', async database => {
					const [row] = await database
						.update(task)
						.set({ completedAt: completedAt ?? null })
						.where(and(eq(task.ownerId, ownerId), eq(task.id, id)))
						.returning()

					return row && toTask(row)
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

					return rows.map(toTask)
				}),
		})
	})
)
