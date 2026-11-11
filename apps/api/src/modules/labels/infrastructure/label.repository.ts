import { label, task, taskLabel } from '@soonlane/db'
import { and, count, eq, isNull } from 'drizzle-orm'
import { Effect, Layer } from 'effect'
import { Db } from '@/platform/db/db.layer'
import { LabelRepository } from '../application/label-repository.port'
import { labelOrder } from './label-order.query'
import { toLabel } from './label.mapper'

export const DrizzleLabelRepositoryLive = Layer.effect(
	LabelRepository,
	Effect.gen(function* () {
		const db = yield* Db

		return LabelRepository.of({
			list: ownerId =>
				db.run('LabelRepository.list', async database => {
					const rows = await database
						.select({ label, openTaskCount: count(task.id) })
						.from(label)
						.leftJoin(taskLabel, eq(taskLabel.labelId, label.id))
						.leftJoin(
							task,
							and(
								eq(task.id, taskLabel.taskId),
								eq(task.ownerId, ownerId),
								isNull(task.completedAt)
							)
						)
						.where(eq(label.ownerId, ownerId))
						.groupBy(label.id)
						.orderBy(...labelOrder)

					return rows.map(row => ({
						...toLabel(row.label),
						openTaskCount: row.openTaskCount,
					}))
				}),
			create: ({ ownerId, name, color }) =>
				db.run('LabelRepository.create', async database => {
					const [row] = await database
						.insert(label)
						.values({ ownerId, name, color: color ?? null })
						.returning()

					if (!row) throw new Error('Label insert returned no row')

					return toLabel(row)
				}),
			update: ({ ownerId, id, name, color }) =>
				db.run('LabelRepository.update', async database => {
					const [row] = await database
						.update(label)
						.set({ name, color })
						.where(and(eq(label.ownerId, ownerId), eq(label.id, id)))
						.returning()

					return row && toLabel(row)
				}),
			delete: ({ ownerId, id }) =>
				db.run('LabelRepository.delete', async database => {
					const [row] = await database
						.delete(label)
						.where(and(eq(label.ownerId, ownerId), eq(label.id, id)))
						.returning()

					return row && toLabel(row)
				}),
		})
	})
)
