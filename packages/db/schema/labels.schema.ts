import type { LabelColor, LabelId, TaskId, UserId } from '@soonlane/domain'
import { sql } from 'drizzle-orm'
import {
	index,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from 'drizzle-orm/pg-core'
import { user } from './auth.schema'
import { task } from './tasks.schema'

export const LABEL_OWNER_NAME_INDEX = 'label_owner_name_idx'

export const label = pgTable(
	'label',
	{
		id: uuid('id').primaryKey().defaultRandom().$type<LabelId>(),
		ownerId: uuid('owner_id')
			.notNull()
			.$type<UserId>()
			.references(() => user.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		color: text('color').$type<LabelColor>(),
		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	table => [
		uniqueIndex(LABEL_OWNER_NAME_INDEX).on(
			table.ownerId,
			sql`lower(${table.name})`
		),
	]
)
export type LabelRow = typeof label.$inferSelect

export const taskLabel = pgTable(
	'task_label',
	{
		taskId: uuid('task_id')
			.notNull()
			.$type<TaskId>()
			.references(() => task.id, { onDelete: 'cascade' }),
		labelId: uuid('label_id')
			.notNull()
			.$type<LabelId>()
			.references(() => label.id, { onDelete: 'cascade' }),
	},
	table => [
		primaryKey({ columns: [table.taskId, table.labelId] }),
		index('task_label_label_idx').on(table.labelId),
	]
)
