import { task } from '@soonlane/db'
import { and, eq, getColumns, isNotNull, sql } from 'drizzle-orm'
import type { Database } from '@/platform/db/db.layer'
import type { ProgressLog } from '../application/task-repository.port'

/** One statement on the row locked as `before`: concurrent logs never lose an increment and `logged` is what this log applied. */
export async function updateProgress(
	database: Pick<Database, '$with' | 'select' | 'with'>,
	{ ownerId, id, amount, loggedAt, advance }: ProgressLog
) {
	const before = database.$with('before').as(
		database
			.select({
				id: task.id,
				progress: task.goalProgress,
				dueDate: task.dueDate,
				completedAt: task.completedAt,
			})
			.from(task)
			.where(
				and(
					eq(task.ownerId, ownerId),
					eq(task.id, id),
					isNotNull(task.goalTarget)
				)
			)
			.for('update')
	)
	const progress = sql<number>`least(greatest(${before.progress} + ${amount}, 0), ${task.goalTarget})`
	const advances =
		advance &&
		sql`${progress} >= ${task.goalTarget} and ${task.dueDate} = ${advance.from} and ${isNotNull(task.repeatUnit)}`
	const [row] = await database
		.with(before)
		.update(task)
		.set({
			goalProgress: advances
				? sql`case when ${advances} then 0 else ${progress} end`
				: progress,
			dueDate:
				advances &&
				sql`case when ${advances} then ${advance.to} else ${task.dueDate} end`,
			// Reaching the target completes a task that does not repeat; leaving it reopens, which is how Undo works.
			completedAt: sql`case
					when ${isNotNull(task.repeatUnit)} then ${task.completedAt}
					when ${progress} >= ${task.goalTarget} then coalesce(${task.completedAt}, ${loggedAt})
					when ${before.progress} >= ${task.goalTarget} then null
					else ${task.completedAt}
				end`,
		})
		.from(before)
		.where(
			and(eq(task.ownerId, ownerId), eq(task.id, id), eq(task.id, before.id))
		)
		.returning({
			...getColumns(task),
			logged: sql<number>`${progress} - ${before.progress}`,
			completed: sql<boolean>`${task.dueDate} <> ${before.dueDate} or (${before.completedAt} is null and ${task.completedAt} is not null)`,
			previousDueDate: before.dueDate,
			previousProgress: before.progress,
		})

	return row
}
