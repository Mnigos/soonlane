import {
	type CalendarDate,
	REPEAT_INTERVAL_MAX,
	REPEAT_UNITS,
	type RepeatUnit,
	SINGLE_INTERVAL_REPEAT_UNITS,
	GOAL_TARGET_MAX,
	GOAL_UNIT_MAX_LENGTH,
	type ProjectId,
	type TaskId,
	type TaskPriority,
	type UserId,
} from '@soonlane/domain'
import { sql } from 'drizzle-orm'
import {
	check,
	date,
	foreignKey,
	index,
	integer,
	pgTable,
	smallint,
	text,
	time,
	timestamp,
	uuid,
} from 'drizzle-orm/pg-core'
import { user } from './auth.schema'
import { project } from './projects.schema'

export const TASK_PROJECT_FOREIGN_KEY = 'task_project_id_project_id_fkey'

function toSqlList(values: readonly string[]) {
	return sql.raw(values.map(value => `'${value}'`).join(', '))
}

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
		repeatUnit: text('repeat_unit').$type<RepeatUnit>(),
		repeatInterval: smallint('repeat_interval'),
		// The due date the rule was set on; it keeps the weekday and day of month across short months.
		repeatAnchor: date('repeat_anchor', {
			mode: 'string',
		}).$type<CalendarDate>(),
		goalTarget: integer('goal_target'),
		goalUnit: text('goal_unit'),
		// The current occurrence's progress, so repeating can reset it with the due date.
		goalProgress: integer('goal_progress').notNull().default(0),
		projectId: uuid('project_id').$type<ProjectId>(),
	},
	table => [
		index('task_owner_due_idx').on(table.ownerId, table.dueDate),
		index('task_project_idx').on(table.projectId),
		foreignKey({
			name: TASK_PROJECT_FOREIGN_KEY,
			columns: [table.projectId],
			foreignColumns: [project.id],
		}).onDelete('set null'),
		check('task_priority_range', sql`${table.priority} between 1 and 4`),
		check(
			'task_repeat_all_or_none',
			sql`num_nulls(${table.repeatUnit}, ${table.repeatInterval}, ${table.repeatAnchor}) in (0, 3)`
		),
		check(
			'task_repeat_unit',
			sql`${table.repeatUnit} in (${toSqlList(REPEAT_UNITS)})`
		),
		check(
			'task_repeat_interval_range',
			sql`${table.repeatInterval} between 1 and ${sql.raw(String(REPEAT_INTERVAL_MAX))}`
		),
		check(
			'task_repeat_single_interval',
			sql`${table.repeatUnit} not in (${toSqlList(SINGLE_INTERVAL_REPEAT_UNITS)}) or ${table.repeatInterval} = 1`
		),
		check(
			'task_goal_target_range',
			sql`${table.goalTarget} between 1 and ${sql.raw(String(GOAL_TARGET_MAX))}`
		),
		check(
			'task_goal_progress_range',
			sql`${table.goalProgress} between 0 and coalesce(${table.goalTarget}, 0)`
		),
		check(
			'task_goal_unit_target',
			sql`${table.goalUnit} is null or ${table.goalTarget} is not null`
		),
		check(
			'task_goal_unit_length',
			sql`char_length(${table.goalUnit}) between 1 and ${sql.raw(String(GOAL_UNIT_MAX_LENGTH))}`
		),
	]
)

export type TaskRow = typeof task.$inferSelect
export type NewTaskRow = typeof task.$inferInsert
