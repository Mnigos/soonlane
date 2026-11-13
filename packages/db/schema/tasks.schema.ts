import {
	type CalendarDate,
	DURATION_MINUTES_MAX,
	DURATION_MINUTES_MIN,
	REPEAT_INTERVAL_MAX,
	REPEAT_UNITS,
	type RepeatUnit,
	SINGLE_INTERVAL_REPEAT_UNITS,
	GOAL_TARGET_MAX,
	GOAL_UNIT_MAX_LENGTH,
	type ProjectId,
	SUBTASK_DEPTH_MAX,
	type TaskId,
	type TaskPriority,
	type UserId,
} from '@soonlane/domain'
import { sql } from 'drizzle-orm'
import {
	boolean,
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
	uniqueIndex,
	uuid,
} from 'drizzle-orm/pg-core'
import { user } from './auth.schema'
import { project } from './projects.schema'

export const TASK_PROJECT_FOREIGN_KEY = 'task_project_id_project_id_fkey'
export const TASK_DURATION_DUE_TIME_CHECK = 'task_duration_due_time'
export const TASK_PARENT_FOREIGN_KEY = 'task_parent_fkey'

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
		// A calendar day without a time zone: the owner's local day when the task was planned; null for a task without a date.
		dueDate: date('due_date', { mode: 'string' }).$type<CalendarDate>(),
		dueTime: time('due_time', { precision: 0 }),
		durationMinutes: smallint('duration_minutes'),
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
		// "every!": the next due date counts from the day the task was completed.
		repeatFromCompletion: boolean('repeat_from_completion')
			.notNull()
			.default(false),
		goalTarget: integer('goal_target'),
		goalUnit: text('goal_unit'),
		// The current occurrence's progress, so repeating can reset it with the due date.
		goalProgress: integer('goal_progress').notNull().default(0),
		projectId: uuid('project_id').$type<ProjectId>(),
		parentId: uuid('parent_id').$type<TaskId>(),
		// Written once at insert: subtasks never move, so it cannot go stale.
		depth: smallint('depth').notNull().default(0),
	},
	table => [
		index('task_owner_due_idx').on(table.ownerId, table.dueDate),
		index('task_project_idx').on(table.projectId),
		foreignKey({
			name: TASK_PROJECT_FOREIGN_KEY,
			columns: [table.projectId],
			foreignColumns: [project.id],
		}).onDelete('set null'),
		uniqueIndex('task_owner_id_key').on(table.ownerId, table.id),
		index('task_owner_parent_idx').on(table.ownerId, table.parentId),
		// Carries the owner, so a subtask can never sit under another owner's task.
		foreignKey({
			name: TASK_PARENT_FOREIGN_KEY,
			columns: [table.ownerId, table.parentId],
			foreignColumns: [table.ownerId, table.id],
		}).onDelete('cascade'),
		check(
			'task_depth_range',
			sql`${table.depth} between 0 and ${sql.raw(String(SUBTASK_DEPTH_MAX))}`
		),
		check(
			'task_parent_depth',
			sql`(${table.parentId} is null) = (${table.depth} = 0)`
		),
		check('task_priority_range', sql`${table.priority} between 1 and 4`),
		check(
			'task_duration_range',
			sql`${table.durationMinutes} between ${sql.raw(String(DURATION_MINUTES_MIN))} and ${sql.raw(String(DURATION_MINUTES_MAX))}`
		),
		check(
			TASK_DURATION_DUE_TIME_CHECK,
			sql`${table.durationMinutes} is null or ${table.dueTime} is not null`
		),
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
			'task_repeat_from_completion_rule',
			sql`not ${table.repeatFromCompletion} or ${table.repeatUnit} is not null`
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
