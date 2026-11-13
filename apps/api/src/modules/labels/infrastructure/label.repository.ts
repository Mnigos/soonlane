import type {
	CreateLabelInput,
	Label,
	ListedLabel,
	UpdateLabelInput,
} from '@soonlane/contracts'
import { label, task, taskLabel } from '@soonlane/db'
import type { LabelId, UserId } from '@soonlane/domain'
import { and, count, eq, isNull } from 'drizzle-orm'
import { Context, Effect, Layer } from 'effect'
import {
	ownedBy,
	SHOWN_IN_LISTS,
} from '@/modules/tasks/infrastructure/owned-tasks.query'
import type { DbError } from '@/platform/db/db.errors'
import { Db } from '@/platform/db/db.layer'
import { labelOrder } from './label-order.query'
import { toLabel } from './label.mapper'

export interface OwnedLabel {
	ownerId: UserId
	id: LabelId
}

export interface NewLabel extends CreateLabelInput {
	ownerId: UserId
}

export type LabelChanges = Omit<UpdateLabelInput, 'id'>

export interface LabelChange extends OwnedLabel, LabelChanges {}

export class LabelRepository extends Context.Service<
	LabelRepository,
	{
		readonly list: (ownerId: UserId) => Effect.Effect<ListedLabel[], DbError>
		readonly create: (label: NewLabel) => Effect.Effect<Label, DbError>
		readonly update: (
			change: LabelChange
		) => Effect.Effect<Label | undefined, DbError>
		readonly delete: (
			label: OwnedLabel
		) => Effect.Effect<Label | undefined, DbError>
	}
>()('soonlane/LabelRepository') {}

export const LabelRepositoryLive = Layer.effect(
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
								ownedBy(ownerId),
								isNull(task.completedAt),
								SHOWN_IN_LISTS
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
