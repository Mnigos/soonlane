import { TODOIST_REVOKE_URL, TODOIST_SYNC_URL } from '@soonlane/auth'
import { Effect, Layer, Redacted, Schema } from 'effect'
import { AppConfig } from '@/platform/config/app.config'
import { TodoistApi } from '../application/todoist-api.port'
import { todoistSnapshotSchema } from '../domain/todoist-snapshot.schemas'
import {
	TodoistNotConfigured,
	TodoistReadFailed,
	toErrorName,
} from '../domain/todoist.errors'

const SNAPSHOT_RESOURCES = '["user","projects","sections","items","labels"]'
/** Todoist's own processing limit for one request. */
const REQUEST_TIMEOUT_MS = 15_000
/** Total time a read may wait out 429s; past it the read fails rather than hold the request open. */
const MAX_RETRY_WAIT_MS = 10_000
const MAX_RETRIES = 3
/** The whole read, every request and wait included. */
const READ_TIMEOUT = '20 seconds'
/** Also the floor, so `Retry-After: 0` cannot spin. */
const MIN_RETRY_AFTER_MS = 1000
const decodeSnapshot = Schema.decodeUnknownEffect(todoistSnapshotSchema)

function readRetryAfterMs(header: string | null) {
	const seconds = Number(header)

	return header && Number.isFinite(seconds)
		? Math.max(seconds * 1000, MIN_RETRY_AFTER_MS)
		: MIN_RETRY_AFTER_MS
}

function post(url: string, init: RequestInit) {
	return Effect.tryPromise({
		try: async signal =>
			await fetch(url, {
				...init,
				method: 'POST',
				signal: AbortSignal.any([
					signal,
					AbortSignal.timeout(REQUEST_TIMEOUT_MS),
				]),
			}),
		catch: toErrorName,
	})
}

/** The sync response as JSON, or the reason it failed: an HTTP status or an error name, never the body. */
function requestSync(
	accessToken: string,
	retriesLeft: number,
	waitedMs: number
): Effect.Effect<unknown, string> {
	return Effect.gen(function* () {
		const response = yield* post(TODOIST_SYNC_URL, {
			headers: { Authorization: `Bearer ${accessToken}` },
			body: new URLSearchParams({
				sync_token: '*',
				resource_types: SNAPSHOT_RESOURCES,
			}),
		})
		const waitMs = readRetryAfterMs(response.headers.get('retry-after'))

		if (
			response.status === 429 &&
			retriesLeft > 0 &&
			waitedMs + waitMs <= MAX_RETRY_WAIT_MS
		) {
			yield* Effect.sleep(waitMs)

			return yield* requestSync(accessToken, retriesLeft - 1, waitedMs + waitMs)
		}
		if (!response.ok) return yield* Effect.fail(String(response.status))

		return yield* Effect.tryPromise({
			try: async () => await response.json(),
			catch: toErrorName,
		})
	})
}

export const HttpTodoistApiLive = Layer.effect(
	TodoistApi,
	Effect.gen(function* () {
		const { todoist } = yield* AppConfig

		if (!todoist)
			return TodoistApi.of({
				readSnapshot: () => Effect.fail(new TodoistNotConfigured()),
				revoke: () => Effect.succeed(false),
			})

		const credentials = btoa(
			`${todoist.clientId}:${Redacted.value(todoist.clientSecret)}`
		)

		return TodoistApi.of({
			readSnapshot: Effect.fn('TodoistApi.readSnapshot')(
				(accessToken: string) =>
					requestSync(accessToken, MAX_RETRIES, 0).pipe(
						Effect.timeoutOrElse({
							duration: READ_TIMEOUT,
							orElse: () => Effect.fail('Timeout'),
						}),
						Effect.flatMap(json =>
							decodeSnapshot(json).pipe(
								Effect.mapError(() => 'UnexpectedSnapshot')
							)
						),
						Effect.tapError(reason =>
							Effect.logWarning('Todoist read failed', reason)
						),
						Effect.mapError(() => new TodoistReadFailed())
					)
			),
			revoke: Effect.fn('TodoistApi.revoke')((token: string) =>
				post(TODOIST_REVOKE_URL, {
					headers: { Authorization: `Basic ${credentials}` },
					body: new URLSearchParams({ token }),
				}).pipe(
					Effect.map(response => response.ok),
					Effect.tapError(reason =>
						Effect.logWarning('Todoist revoke failed', reason)
					),
					Effect.orElseSucceed(() => false)
				)
			),
		})
	})
)
