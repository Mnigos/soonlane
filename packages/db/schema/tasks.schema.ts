import type {
	CalendarDate,
	TaskId,
	TaskPriority,
	UserId,
} from '@soonlane/domain'
import { sql } from 'drizzle-orm'
import {
	check,
	date,
	index,
	pgTable,
	smallint,
	text,
	time,
	timestamp,
	uuid,
} from 'drizzle-orm/pg-core'
import { user } from './auth.schema'

export const task = pgTable(
	'task',
	{
		id: uuid('id').primaryKey().defaultRandom().$type<TaskId>(),
		ownerId: uuid('owner_id')
			.notNull()
			.$type<UserId>()
			.references(() => user.id, { onDelete: 'cascade' }),
		title: text('title').notNull(),
		description: text('description'),
		// A calendar day without a time zone: the owner's local day when the task was planned.
		dueDate: date('due_date', { mode: 'string' })
			.notNull()
			.$type<CalendarDate>(),
		dueTime: time('due_time', { precision: 0 }),
		priority: smallint('priority').notNull().default(4).$type<TaskPriority>(),
		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
		completedAt: timestamp('completed_at', { withTimezone: true }),
	},
	table => [
		index('task_owner_due_idx').on(table.ownerId, table.dueDate),
		check('task_priority_range', sql`${table.priority} between 1 and 4`),
	]
)

export type TaskRow = typeof task.$inferSelect
export type NewTaskRow = typeof task.$inferInsert
