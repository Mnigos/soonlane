import type {
	TodoistImportSummary,
	TodoistPreview,
	TodoistStatus,
} from '@soonlane/contracts'
import type { UserId } from '@soonlane/domain'
import { Cause, Clock, Context, Effect, Exit, Layer, Schedule } from 'effect'
import { Analytics } from '@/modules/analytics/application/analytics.port'
import { Auth } from '@/modules/identity/application/auth.port'
import { LabelsService } from '@/modules/labels/application/labels.service'
import { ProjectsService } from '@/modules/projects/application/projects.service'
import { AppConfig } from '@/platform/config/app.config'
import type { DbError } from '@/platform/db/db.errors'
import { planTodoistImport, toTaskDue } from '../domain/todoist-import.helper'
import {
	TodoistConnectionExpired,
	TodoistNotConfigured,
	TodoistNotConnected,
	TodoistReadFailed,
	TodoistStillConnected,
	toErrorName,
} from '../domain/todoist.errors'
import { ImportedTodoistTaskRepository } from '../infrastructure/imported-todoist-task.repository'
import {
	type TodoistAccount,
	TodoistAccountRepository,
} from '../infrastructure/todoist-account.repository'
import { TodoistApi } from './todoist-api.port'

type TodoistReadError =
	| TodoistNotConfigured
	| TodoistNotConnected
	| TodoistConnectionExpired
	| TodoistReadFailed
	| DbError

export class TodoistService extends Context.Service<
	TodoistService,
	{
		readonly status: (ownerId: UserId) => Effect.Effect<TodoistStatus, DbError>
		/** Reads the connected account once and maps it; a failed read or an expired connection is closed first. */
		readonly preview: (
			ownerId: UserId
		) => Effect.Effect<TodoistPreview, TodoistReadError>
		/** Reads the connected account again and saves what it plans; the connection closes on success and on failure. */
		readonly import: (
			ownerId: UserId,
			timeZone: string
		) => Effect.Effect<TodoistImportSummary, TodoistReadError>
		/** Fails when a connection stays because Todoist did not confirm its revocation. */
		readonly cancel: (
			ownerId: UserId
		) => Effect.Effect<
			void,
			TodoistNotConfigured | TodoistStillConnected | DbError
		>
	}
>()('soonlane/TodoistService') {}

/** How long a link lives without an import; the sweep closes it after that. */
const CONNECTION_LIFETIME_MS = 15 * 60 * 1000
/** Todoist access tokens die after an hour, so a row older than that goes even when revoking keeps failing. */
const REVOKE_GIVE_UP_MS = 60 * 60 * 1000
const SWEEP_INTERVAL = '1 minute'

function ageOf(linked: TodoistAccount) {
	return Clock.currentTimeMillis.pipe(
		Effect.map(now => now - linked.linkedAt.getTime())
	)
}

export const TodoistServiceLive = Layer.effect(
	TodoistService,
	Effect.gen(function* () {
		const { todoist, maintenance } = yield* AppConfig
		const repository = yield* TodoistAccountRepository
		const importedRepository = yield* ImportedTodoistTaskRepository
		const analytics = yield* Analytics
		const todoistApi = yield* TodoistApi
		const auth = yield* Auth
		const labelsService = yield* LabelsService
		const projectsService = yield* ProjectsService

		const readToken = (stored: string | null) =>
			stored
				? Effect.tryPromise({
						try: async () => await auth.readStoredToken(stored),
						catch: () => new TodoistReadFailed(),
					})
				: Effect.fail(new TodoistReadFailed())

		/** Revokes both tokens at Todoist, then deletes the row; a failed revocation keeps it for the next sweep until the access token is dead anyway. Whether the row is gone. */
		const disconnect = Effect.fn('TodoistService.disconnect')(function* (
			linked: TodoistAccount
		) {
			const stored = [linked.accessToken, linked.refreshToken].filter(
				token => token !== null
			)
			const revoked = yield* Effect.all(
				stored.map(token =>
					readToken(token).pipe(
						Effect.flatMap(todoistApi.revoke),
						Effect.orElseSucceed(() => false)
					)
				),
				{ concurrency: 'unbounded' }
			)

			if (
				!revoked.every(Boolean) &&
				(yield* ageOf(linked)) <= REVOKE_GIVE_UP_MS
			)
				return false

			yield* repository.delete(linked)

			return true
		})

		const status = Effect.fn('TodoistService.status')(function* (
			ownerId: UserId
		) {
			if (!todoist) return { configured: false, connected: false }

			const accounts = yield* repository.list(ownerId)

			return { configured: true, connected: accounts.length > 0 }
		})

		/** The owner's live connection; an expired one is closed first. */
		const findLive = Effect.fn('TodoistService.findLive')(function* (
			ownerId: UserId
		) {
			if (!todoist) return yield* new TodoistNotConfigured()

			const [linked] = yield* repository.list(ownerId)

			if (!linked) return yield* new TodoistNotConnected()
			if ((yield* ageOf(linked)) > CONNECTION_LIFETIME_MS) {
				yield* disconnect(linked)

				return yield* new TodoistConnectionExpired()
			}

			return linked
		})

		const plan = (ownerId: UserId, linked: TodoistAccount) =>
			readToken(linked.accessToken).pipe(
				Effect.flatMap(todoistApi.readSnapshot),
				Effect.flatMap(snapshot =>
					Effect.all([
						labelsService.list(ownerId),
						projectsService.list(ownerId),
						importedRepository.list(ownerId),
					]).pipe(
						Effect.map(([labels, projects, importedTodoistIds]) =>
							planTodoistImport(
								snapshot,
								labels.map(({ name }) => name),
								projects.map(({ name }) => name),
								importedTodoistIds
							)
						)
					)
				)
			)

		const preview = Effect.fn('TodoistService.preview')(function* (
			ownerId: UserId
		) {
			const linked = yield* findLive(ownerId)

			return yield* plan(ownerId, linked).pipe(
				Effect.map(planned => planned.preview),
				Effect.tapCause(cause =>
					Cause.hasInterruptsOnly(cause) ? Effect.void : disconnect(linked)
				)
			)
		})

		const importTasks = Effect.fn('TodoistService.import')(function* (
			ownerId: UserId,
			timeZone: string
		) {
			const linked = yield* findLive(ownerId)
			const summary = yield* plan(ownerId, linked).pipe(
				Effect.flatMap(planned =>
					importedRepository
						.create({
							ownerId,
							tasks: planned.tasks.map(({ due, ...draft }) => ({
								...draft,
								...toTaskDue(due, timeZone),
							})),
							newLabels: planned.newLabels,
							newProjectNames: planned.newProjectNames,
						})
						.pipe(
							Effect.map(counts => ({
								...counts,
								leftOut: planned.preview.changes.noDate,
							}))
						)
				),
				Effect.onExit(exit =>
					Exit.isFailure(exit) && Cause.hasInterruptsOnly(exit.cause)
						? Effect.void
						: Effect.ignore(disconnect(linked))
				)
			)

			yield* analytics.capture(ownerId, 'todoist_imported', {
				tasks: summary.tasks,
				changed_tasks: summary.changedTasks,
				left_out: summary.leftOut,
				new_labels: summary.newLabels,
				new_projects: summary.newProjects,
			})

			return summary
		})

		const cancel = Effect.fn('TodoistService.cancel')(function* (
			ownerId: UserId
		) {
			if (!todoist) return yield* new TodoistNotConfigured()

			const accounts = yield* repository.list(ownerId)
			const closed = yield* Effect.all(
				accounts.map(linked => disconnect(linked)),
				{ concurrency: 'unbounded' }
			)

			return yield* closed.every(Boolean)
				? Effect.void
				: Effect.fail(new TodoistStillConnected())
		})

		const sweep = Effect.fn('TodoistService.sweep')(function* () {
			const now = yield* Clock.currentTimeMillis
			const expired = yield* repository.listLinkedBefore(
				new Date(now - CONNECTION_LIFETIME_MS)
			)

			yield* Effect.forEach(expired, disconnect, { discard: true })
		})

		// Maintenance refuses every write, so the sweep waits for the next start.
		if (todoist && !maintenance)
			yield* sweep().pipe(
				Effect.catchCause(cause =>
					Effect.logError(
						'Todoist sweep failed',
						toErrorName(Cause.squash(cause))
					)
				),
				Effect.repeat(Schedule.spaced(SWEEP_INTERVAL)),
				Effect.forkScoped
			)

		return TodoistService.of({
			status,
			preview,
			import: importTasks,
			cancel,
		})
	})
)
