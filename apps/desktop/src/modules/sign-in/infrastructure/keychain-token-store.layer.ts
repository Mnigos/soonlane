import { secrets } from 'bun'
import { Effect, Layer, Option } from 'effect'
import { DesktopConfig } from '../../../platform/config/desktop.config'
import { APP_IDENTIFIER } from '../../../platform/config/desktop.constants'
import { TokenStore } from '../application/token-store.port'
import { TokenNotClearedError } from '../domain/sign-in.errors'

function logFailure(operation: string) {
	return () => Effect.logWarning(`Keychain ${operation} failed`)
}

/**
 * The token in the macOS Keychain through `Bun.secrets`, one item per API
 * origin, so a development build never reads production's token. A failed
 * read leaves the app signed out; a failed write keeps the token only in
 * memory; a failed delete fails the sign-out.
 */
export const KeychainTokenStoreLive = Layer.effect(
	TokenStore,
	Effect.gen(function* () {
		const { apiUrl } = yield* DesktopConfig
		const item = { service: APP_IDENTIFIER, name: apiUrl.origin }
		return TokenStore.of({
			load: Effect.tryPromise(async () => await secrets.get(item)).pipe(
				Effect.map(Option.fromNullishOr),
				Effect.catch(() =>
					logFailure('read')().pipe(Effect.as(Option.none<string>()))
				)
			),
			save: token =>
				Effect.tryPromise(
					async () => await secrets.set({ ...item, value: token })
				).pipe(Effect.catch(logFailure('write'))),
			clear: Effect.tryPromise(async () => await secrets.delete(item)).pipe(
				Effect.asVoid,
				Effect.catch(() =>
					logFailure('delete')().pipe(
						Effect.andThen(Effect.fail(new TokenNotClearedError()))
					)
				)
			),
		})
	})
)
