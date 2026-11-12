import type { UserId } from '@soonlane/domain'
import { pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { user } from './auth.schema'

/** A Todoist task the owner imported; it outlives its Soonlane task, so a deleted or completed task does not come back on the next import. */
export const importedTodoistTask = pgTable(
	'imported_todoist_task',
	{
		ownerId: uuid('owner_id')
			.notNull()
			.$type<UserId>()
			.references(() => user.id, { onDelete: 'cascade' }),
		todoistId: text('todoist_id').notNull(),
		importedAt: timestamp('imported_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	table => [primaryKey({ columns: [table.ownerId, table.todoistId] })]
)
