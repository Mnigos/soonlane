import type { UserId } from '@soonlane/domain'
import { Cause, Clock, Context, Effect, Layer, Schedule } from 'effect'
import type { DbError } from '@/platform/db/db.errors'
import { toErrorName } from '../domain/error-name.helper'
import { PersonDeletionRepository } from '../infrastructure/person-deletion.repository'
import { Analytics } from './analytics.port'

/**
 * Deleting a person removes only the events PostHog took in before the request, once per person: its uuid is derived from
 * the user id, so a later request cannot reach events a straggling batch added. One request after this delay covers the
 * batches every app still sends when an account is deleted (docs/analytics.md).
 */
const PERSON_DELETION_DELAY_MS = 15 * 60 * 1000
const RETRY_DELAY_MS = 30 * 60 * 1000
const SWEEP_INTERVAL = '1 minute'

export class AnalyticsService extends Context.Service<
	AnalyticsService,
	{
		/** Deletes the user's PostHog person after the delay, retrying until PostHog accepts; fails, and so keeps the account, when it cannot be stored. */
		readonly schedulePersonDeletion: (
			userId: UserId
		) => Effect.Effect<void, DbError>
	}
>()('soonlane/AnalyticsService') {}

export const AnalyticsServiceLive = Layer.effect(
	AnalyticsService,
	Effect.gen(function* () {
		const repository = yield* PersonDeletionRepository
		const analytics = yield* Analytics

		const schedulePersonDeletion = Effect.fn(
			'AnalyticsService.schedulePersonDeletion'
		)(function* (userId: UserId) {
			const now = yield* Clock.currentTimeMillis

			yield* repository.create(userId, new Date(now + PERSON_DELETION_DELAY_MS))
		})

		const deletePerson = (userId: UserId) =>
			analytics.deletePerson(userId).pipe(
				Effect.andThen(repository.delete(userId)),
				// Without the user id: an exception under it would bring the person back.
				Effect.catchTag('PersonDeletionFailed', error =>
					Effect.logWarning(
						'PostHog person deletion failed',
						error.reason
					).pipe(
						Effect.andThen(
							analytics.captureException(error, undefined, {
								reason: error.reason,
							})
						)
					)
				),
				// One row's database error leaves only that row for its retry; the rest of the batch goes on.
				Effect.catchTag('DbError', error =>
					Effect.logError('PostHog person deletion failed', error._tag)
				)
			)

		const sweep = Effect.fn('AnalyticsService.sweep')(function* () {
			const now = yield* Clock.currentTimeMillis

			const kept = yield* repository.deleteForRemainingUsers(new Date(now))

			if (kept.length > 0)
				yield* Effect.logWarning(
					'Dropped PostHog person deletions of accounts that were not deleted',
					kept.length
				)

			const due = yield* repository.claimDue(
				new Date(now),
				new Date(now + RETRY_DELAY_MS)
			)

			yield* Effect.forEach(due, deletePerson, { discard: true })
		})

		yield* sweep().pipe(
			Effect.catchCause(cause =>
				Effect.logError(
					'PostHog person deletion sweep failed',
					toErrorName(Cause.squash(cause))
				)
			),
			Effect.repeat(Schedule.spaced(SWEEP_INTERVAL)),
			Effect.forkScoped
		)

		return AnalyticsService.of({ schedulePersonDeletion })
	})
)
