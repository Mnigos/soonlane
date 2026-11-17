import type { UserId } from '@soonlane/domain'
import { pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'

/** A deleted account's PostHog person the API has yet to delete; no foreign key, because the user row goes first. */
export const personDeletion = pgTable('person_deletion', {
	userId: uuid('user_id').primaryKey().$type<UserId>(),
	dueAt: timestamp('due_at', { withTimezone: true }).notNull(),
})
