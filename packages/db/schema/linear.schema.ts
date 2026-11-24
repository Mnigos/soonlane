import type { TaskId } from '@soonlane/domain'
import { pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { task } from './tasks.schema'

/** A Linear issue pinned to a task: Linear's id, with the identifier, title and URL as they were at pinning, so it reads and opens without a connection. */
export const linearPin = pgTable(
	'linear_pin',
	{
		taskId: uuid('task_id')
			.notNull()
			.$type<TaskId>()
			.references(() => task.id, { onDelete: 'cascade' }),
		issueId: text('issue_id').notNull(),
		identifier: text('identifier').notNull(),
		title: text('title').notNull(),
		url: text('url').notNull(),
		pinnedAt: timestamp('pinned_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	table => [primaryKey({ columns: [table.taskId, table.issueId] })]
)
