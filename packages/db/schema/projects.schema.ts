import type { ProjectId, UserId } from '@soonlane/domain'
import { sql } from 'drizzle-orm'
import {
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from 'drizzle-orm/pg-core'
import { user } from './auth.schema'

export const PROJECT_OWNER_NAME_INDEX = 'project_owner_name_idx'

export const project = pgTable(
	'project',
	{
		id: uuid('id').primaryKey().defaultRandom().$type<ProjectId>(),
		ownerId: uuid('owner_id')
			.notNull()
			.$type<UserId>()
			.references(() => user.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	table => [
		uniqueIndex(PROJECT_OWNER_NAME_INDEX).on(
			table.ownerId,
			sql`lower(${table.name})`
		),
	]
)

export type ProjectRow = typeof project.$inferSelect
