import { label } from '@soonlane/db'
import { and, eq, ne, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { Effect, Layer } from 'effect'
import { Db } from '@/platform/db/db.layer'
import { LabelRepository } from '../application/label-repository.port'
import { labelOrder, toLabel } from './label-row.helper'

export const DrizzleLabelRepositoryLive = Layer.effect(
	LabelRepository,
	Effect.gen(function* () {
		const db = yield* Db

		return LabelRepository.of({
			list: ownerId =>
				db.run('LabelRepository.list', async database => {
					const rows = await database
						.select()
						.from(label)
						.where(eq(label.ownerId, ownerId))
						.orderBy(...labelOrder)

					return rows.map(toLabel)
				}),
			isNameTaken: ({ ownerId, id, name }) =>
				db.run('LabelRepository.isNameTaken', async database => {
					const renamed = alias(label, 'renamed')
					// Only a label the owner can rename reports a clash, so a foreign one stays NOT_FOUND.
					const [row] = await database
						.select({ id: label.id })
						.from(label)
						.innerJoin(
							renamed,
							and(eq(renamed.ownerId, ownerId), eq(renamed.id, id))
						)
						.where(
							and(
								eq(label.ownerId, ownerId),
								ne(label.id, id),
								eq(sql`lower(${label.name})`, sql`lower(${name})`)
							)
						)
						.limit(1)

					return row !== undefined
				}),
			create: ({ ownerId, name, color }) =>
				db.run('LabelRepository.create', async database => {
					const [row] = await database
						.insert(label)
						.values({ ownerId, name, color: color ?? null })
						.onConflictDoNothing()
						.returning()

					return row && toLabel(row)
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
