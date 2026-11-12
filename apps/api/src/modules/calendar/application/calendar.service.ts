import { createHash, randomBytes } from 'node:crypto'
import type {
	CalendarSubscription,
	CreatedCalendarSubscription,
} from '@soonlane/contracts'
import type { UserId } from '@soonlane/domain'
import { Clock, Context, Effect, Layer } from 'effect'
import { TasksService } from '@/modules/tasks/application/tasks.service'
import { AppConfig } from '@/platform/config/app.config'
import type { DbError } from '@/platform/db/db.errors'
import { buildCalendarFeed } from '../domain/calendar-feed.helper'
import { CalendarSubscriptionRepository } from '../infrastructure/calendar-subscription.repository'

export class CalendarService extends Context.Service<
	CalendarService,
	{
		readonly getSubscription: (
			ownerId: UserId
		) => Effect.Effect<CalendarSubscription | undefined, DbError>
		readonly createSubscription: (
			ownerId: UserId
		) => Effect.Effect<CreatedCalendarSubscription, DbError>
		readonly revokeSubscription: (
			ownerId: UserId
		) => Effect.Effect<void, DbError>
		/** The owner's open tasks as iCalendar text, or `undefined` for a token that is malformed, revoked or unknown. */
		readonly buildFeed: (
			token: string
		) => Effect.Effect<string | undefined, DbError>
	}
>()('soonlane/CalendarService') {}

const TOKEN_BYTES = 32
/** 32 random bytes in base64url; anything else was never issued, so it is turned away before a query. */
const TOKEN_PATTERN = /^[\w-]{43}$/u

/** 256 bits of entropy need no salt, and a lookup by hash leaves no secret comparison to time. */
function hashToken(token: string) {
	return createHash('sha256').update(token).digest('hex')
}

export const CalendarServiceLive = Layer.effect(
	CalendarService,
	Effect.gen(function* () {
		const repository = yield* CalendarSubscriptionRepository
		const tasksService = yield* TasksService
		const { baseUrl, appUrl } = yield* AppConfig

		const getSubscription = Effect.fn('CalendarService.getSubscription')(
			function* (ownerId: UserId) {
				return yield* repository.find(ownerId)
			}
		)

		const createSubscription = Effect.fn('CalendarService.createSubscription')(
			function* (ownerId: UserId) {
				const token = randomBytes(TOKEN_BYTES).toString('base64url')
				const subscription = yield* repository.create({
					ownerId,
					tokenHash: hashToken(token),
				})

				return { subscription, url: `${baseUrl}/calendar/${token}.ics` }
			}
		)

		const revokeSubscription = Effect.fn('CalendarService.revokeSubscription')(
			function* (ownerId: UserId) {
				yield* repository.delete(ownerId)
			}
		)

		const buildFeed = Effect.fn('CalendarService.buildFeed')(function* (
			token: string
		) {
			if (!TOKEN_PATTERN.test(token)) return undefined

			const subscription = yield* repository.findByTokenHash(hashToken(token))

			if (!subscription) return undefined

			const tasks = yield* tasksService.listOpen(subscription.ownerId)

			return buildCalendarFeed({
				tasks,
				taskUrl: `${appUrl}/app`,
				builtAt: new Date(yield* Clock.currentTimeMillis),
			})
		})

		return CalendarService.of({
			getSubscription,
			createSubscription,
			revokeSubscription,
			buildFeed,
		})
	})
)
