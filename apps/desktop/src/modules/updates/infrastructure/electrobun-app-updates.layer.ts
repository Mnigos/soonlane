import { Effect, Layer, PubSub, Schedule, Stream } from 'effect'
import { Updater } from 'electrobun'
import { AppUpdates } from '../application/app-updates.port'
import { UPDATE_CHECK_INTERVAL } from '../domain/updates.constants'

/**
 * Electrobun's updater on the release channel the build was made for: it reads
 * `release.baseUrl` (electrobun.config.ts) and answers "no update" on dev builds.
 * Failures are logged by message only; the next check tries again.
 */
export const ElectrobunAppUpdatesLive = Layer.effect(
	AppUpdates,
	Effect.gen(function* () {
		const ready = yield* PubSub.unbounded<undefined>()
		const download = Effect.tryPromise(async () => {
			const { updateAvailable } = await Updater.checkForUpdate()

			if (!updateAvailable) return false

			await Updater.downloadUpdate()

			return Updater.updateInfo().updateReady
		}).pipe(
			Effect.catch(() =>
				Effect.logWarning(
					'Update check failed',
					Updater.updateInfo().error
				).pipe(Effect.as(false))
			)
		)
		const apply = Effect.tryPromise(
			async () => await Updater.applyUpdate()
		).pipe(Effect.catch(() => Effect.logWarning('Could not apply the update')))

		yield* download.pipe(
			Effect.flatMap(isReady =>
				isReady ? PubSub.publish(ready, undefined) : Effect.void
			),
			Effect.repeat(Schedule.spaced(UPDATE_CHECK_INTERVAL)),
			Effect.forkScoped
		)

		return AppUpdates.of({
			ready: Stream.fromPubSub(ready),
			apply,
			install: download.pipe(
				Effect.tap(isReady => (isReady ? apply : Effect.void))
			),
		})
	})
)
