import type { LinearPin, Task } from '@soonlane/contracts'
import type { TaskId, UserId } from '@soonlane/domain'
import { Context, Effect, Layer } from 'effect'
import { ownedTasks } from '@/modules/tasks/infrastructure/owned-tasks.query'
import type { DbError } from '@/platform/db/db.errors'
import { Db } from '@/platform/db/db.layer'

export interface PinnedIssue {
	ownerId: UserId
	id: TaskId
	pin: LinearPin
}

export interface UnpinnedIssue {
	ownerId: UserId
	id: TaskId
	issueId: string
}

/** Pins live on the owner's tasks, so both writes go through `ownedTasks` and return the task, `undefined` when the owner has no such task. */
export class LinearPinRepository extends Context.Service<
	LinearPinRepository,
	{
		/** The returned task lacks the pin when the task was already at the limit. */
		readonly pin: (
			pinned: PinnedIssue
		) => Effect.Effect<Task | undefined, DbError>
		readonly unpin: (
			unpinned: UnpinnedIssue
		) => Effect.Effect<Task | undefined, DbError>
	}
>()('soonlane/LinearPinRepository') {}

export const LinearPinRepositoryLive = Layer.effect(
	LinearPinRepository,
	Effect.gen(function* () {
		const db = yield* Db

		return LinearPinRepository.of({
			pin: ({ ownerId, id, pin }) =>
				db.transaction('LinearPinRepository.pin', async transaction => {
					const tasks = ownedTasks(transaction, ownerId)

					await tasks.pinLinearIssue(id, pin)

					return await tasks.find(id)
				}),
			unpin: ({ ownerId, id, issueId }) =>
				db.run('LinearPinRepository.unpin', async database => {
					const tasks = ownedTasks(database, ownerId)

					await tasks.unpinLinearIssue(id, issueId)

					return await tasks.find(id)
				}),
		})
	})
)
