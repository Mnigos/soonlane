import type { LinearStatus } from '@soonlane/contracts'
import type { UserId } from '@soonlane/domain'
import { Clock, Context, Effect, Fiber, Layer, Semaphore } from 'effect'
import { Auth } from '@/modules/identity/application/auth.port'
import { AppConfig } from '@/platform/config/app.config'
import type { DbError } from '@/platform/db/db.errors'
import {
	LinearConnectionLapsed,
	LinearNotConfigured,
	type LinearReadFailed,
	LinearStillConnected,
} from '../domain/linear.errors'
import {
	type LinearAccount,
	LinearAccountRepository,
} from '../infrastructure/linear-account.repository'
import { LinearApi } from './linear-api.port'

export class LinearService extends Context.Service<
	LinearService,
	{
		/** Refreshes the access token first when it is about to expire; a grant Linear refuses reads as lapsed. */
		readonly status: (
			ownerId: UserId
		) => Effect.Effect<LinearStatus, LinearReadFailed | DbError>
		/** Fails, keeping the connection, when Linear did not confirm a revocation. */
		readonly disconnect: (
			ownerId: UserId
		) => Effect.Effect<
			void,
			LinearNotConfigured | LinearStillConnected | DbError
		>
	}
>()('soonlane/LinearService') {}

/** Linear's access tokens live 24 hours; refreshing this early leaves room for the request that needs one. */
const REFRESH_MARGIN_MS = 5 * 60 * 1000
const REFRESH_TIMEOUT = '15 seconds'

export const LinearServiceLive = Layer.effect(
	LinearService,
	Effect.gen(function* () {
		const { linear } = yield* AppConfig
		const repository = yield* LinearAccountRepository
		const linearApi = yield* LinearApi
		const auth = yield* Auth
		// Linear rotates the refresh token on every use, so a refresh racing another, or a Disconnect revoking the pair mid-refresh, would lose the connection or leave a grant behind; one permit per process covers both at a refresh per user a day.
		const linearPermit = yield* Semaphore.make(1)

		const readToken = (stored: string) =>
			Effect.tryPromise({
				try: async () => await auth.readStoredToken(stored),
				catch: () => new LinearConnectionLapsed(),
			})

		/** The row's stored access token while it has more than the margin left. */
		const freshToken = Effect.fn('LinearService.freshToken')(function* (
			linked: LinearAccount
		) {
			const now = yield* Clock.currentTimeMillis
			const expiresAt = linked.accessTokenExpiresAt?.getTime() ?? 0

			return expiresAt - now > REFRESH_MARGIN_MS
				? (linked.accessToken ?? undefined)
				: undefined
		})

		/** Under the permit, held until Better Auth's refresh settles, so the next refresh or Disconnect reads the pair it wrote; the row is read again first, since one queued ahead may have refreshed it. */
		const refresh = Effect.fn('LinearService.refresh')(function* (
			ownerId: UserId
		) {
			const [linked] = yield* repository.list(ownerId)

			if (!linked) return undefined

			const stored = yield* freshToken(linked)

			if (stored) return yield* readToken(stored)

			return yield* Effect.tryPromise({
				try: async () => await auth.refreshStoredToken(ownerId, linked.id),
				catch: error => (error instanceof Error ? error.message : typeof error),
			}).pipe(
				Effect.tapError(code =>
					Effect.logWarning('Linear refresh failed', code)
				),
				Effect.mapError(() => new LinearConnectionLapsed())
			)
		}, Semaphore.withPermit(linearPermit))

		/** A live access token for the owner's newest row, `undefined` without one; a fresh token needs no permit, and a caller waits for a refresh at most the timeout, reading lapsed until a later call. */
		const readAccessToken = Effect.fn('LinearService.readAccessToken')(
			function* (ownerId: UserId) {
				const [linked] = yield* repository.list(ownerId)

				if (!linked) return undefined

				const stored = yield* freshToken(linked)

				if (stored) return yield* readToken(stored)

				const refreshing = yield* Effect.forkDetach(refresh(ownerId))

				return yield* Fiber.join(refreshing).pipe(
					Effect.timeoutOrElse({
						duration: REFRESH_TIMEOUT,
						orElse: () =>
							Effect.logWarning('Linear refresh still running').pipe(
								Effect.andThen(Effect.fail(new LinearConnectionLapsed()))
							),
					})
				)
			}
		)

		const status = Effect.fn('LinearService.status')(function* (
			ownerId: UserId
		) {
			if (!linear) return { state: 'notConfigured' } satisfies LinearStatus

			return yield* readAccessToken(ownerId).pipe(
				Effect.flatMap(accessToken =>
					accessToken === undefined
						? Effect.succeed<LinearStatus>({ state: 'notConnected' })
						: linearApi.readWorkspaceName(accessToken).pipe(
								Effect.map((workspace): LinearStatus => ({
									state: 'connected',
									workspace,
								}))
							)
				),
				Effect.catchTag('LinearConnectionLapsed', () =>
					Effect.succeed<LinearStatus>({ state: 'lapsed' })
				)
			)
		})

		/** Uninterruptible once it holds the permit, so a dropped request cannot free it while revocations still run and a refresh writes a new pair behind them. */
		const disconnect = Effect.fn('LinearService.disconnect')(
			function* (ownerId: UserId) {
				if (!linear) return yield* new LinearNotConfigured()

				const accounts = yield* repository.list(ownerId)
				const closed = yield* Effect.forEach(
					accounts,
					linked =>
						Effect.forEach(
							[
								[linked.accessToken, 'access_token'],
								[linked.refreshToken, 'refresh_token'],
							] as const,
							([stored, kind]) =>
								stored === null
									? Effect.succeed(true)
									: readToken(stored).pipe(
											Effect.flatMap(token => linearApi.revoke(token, kind)),
											// Nobody can revoke a token this server can no longer decrypt, so it must not keep the row.
											Effect.catchTag('LinearConnectionLapsed', () =>
												Effect.succeed(true)
											)
										),
							{ concurrency: 'unbounded' }
						).pipe(
							Effect.flatMap(revoked =>
								revoked.every(Boolean)
									? repository.delete(linked).pipe(Effect.as(true))
									: Effect.succeed(false)
							)
						),
					{ concurrency: 'unbounded' }
				)

				return yield* closed.every(Boolean)
					? Effect.void
					: Effect.fail(new LinearStillConnected())
			},
			Effect.uninterruptible,
			Semaphore.withPermit(linearPermit)
		)

		return LinearService.of({ status, disconnect })
	})
)
