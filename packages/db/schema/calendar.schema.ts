import type { UserId } from '@soonlane/domain'
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { user } from './auth.schema'

/** One private calendar link per owner; only the SHA-256 of its secret is kept, so the link can be shown once and never again. */
export const calendarSubscription = pgTable('calendar_subscription', {
	ownerId: uuid('owner_id')
		.primaryKey()
		.$type<UserId>()
		.references(() => user.id, { onDelete: 'cascade' }),
	tokenHash: text('token_hash').notNull().unique(),
	createdAt: timestamp('created_at', { withTimezone: true })
		.notNull()
		.defaultNow(),
})
export type CalendarSubscriptionRow = typeof calendarSubscription.$inferSelect
