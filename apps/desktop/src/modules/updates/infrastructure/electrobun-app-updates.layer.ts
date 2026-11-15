import { Effect, Layer, Schedule, Stream, SubscriptionRef } from 'effect'
import { Updater } from 'electrobun'
import { DesktopConfig } from '../../../platform/config/desktop.config'
import { AppUpdates } from '../application/app-updates.port'
import { UPDATE_CHECK_INTERVAL } from '../domain/updates.constants'

/** Builds that must not replace themselves with a release: unsigned ones (pull requests, local packages). */
const NoAppUpdates = AppUpdates.of({
	isReady: Effect.succeed(false),
	ready: Stream.empty,
	apply: Effect.succeed(false),
	install: Effect.succeed(false),
})

/** The SDK's apply resolves after a failure too; only a started restart ends on this status. */
function hasStartedRestart() {
	return Updater.getStatusHistory().at(-1)?.status === 'launching-new-version'
}

/**
 * Electrobun's updater on signed builds' release channel: it reads
 * `release.baseUrl` (electrobun.config.ts) and answers "no update" on dev builds.
 * Failures are logged by message only; the next check tries again.
 */
export const ElectrobunAppUpdatesLive = Layer.effect(
	AppUpdates,
	Effect.gen(function* () {
		const { updatesEnabled } = yield* DesktopConfig

		if (!updatesEnabled) return NoAppUpdates

		const isReady = yield* SubscriptionRef.make(false)
		const syncReady = Effect.suspend(() =>
			SubscriptionRef.set(isReady, Updater.updateInfo().updateReady)
		)
		const download = Effect.tryPromise(async () => {
			const { updateAvailable } = await Updater.checkForUpdate()

			if (updateAvailable) await Updater.downloadUpdate()

			return Updater.updateInfo().updateReady
		}).pipe(
			Effect.catch(() =>
				Effect.logWarning(
					'Update check failed',
					Updater.updateInfo().error
				).pipe(Effect.as(false))
			),
			Effect.tap(ready => SubscriptionRef.set(isReady, ready))
		)
		const apply = Effect.tryPromise(async () => {
			await Updater.applyUpdate()

			return hasStartedRestart()
		}).pipe(
			Effect.orElseSucceed(() => false),
			Effect.tap(started =>
				started
					? Effect.void
					: Effect.logWarning(
							'Could not apply the update',
							Updater.updateInfo().error
						).pipe(Effect.andThen(syncReady))
			)
		)

		yield* download.pipe(
			Effect.repeat(Schedule.spaced(UPDATE_CHECK_INTERVAL)),
			Effect.forkScoped
		)

		return AppUpdates.of({
			isReady: SubscriptionRef.get(isReady),
			ready: SubscriptionRef.changes(isReady).pipe(
				Stream.changes,
				Stream.filter(Boolean),
				Stream.as(undefined)
			),
			apply,
			install: download.pipe(
				Effect.flatMap(ready => (ready ? apply : Effect.succeed(false)))
			),
		})
	})
)
