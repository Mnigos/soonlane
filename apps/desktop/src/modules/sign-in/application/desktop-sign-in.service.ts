import { createCodeVerifier, toCodeChallenge } from '@soonlane/auth'
import { Context, Effect, Layer, Option, Ref } from 'effect'
import { DesktopConfig } from '../../../platform/config/desktop.config'
import { SystemBrowser } from '../../navigation/application/system-browser.port'
import { MainWindow } from '../../window/application/main-window.port'
import {
	getBrowserSignInUrl,
	getCallbackUrl,
	readSignInCode,
} from '../domain/sign-in.helper'

export class DesktopSignIn extends Context.Service<
	DesktopSignIn,
	{
		readonly start: (requestedHref: string) => Effect.Effect<void>
		readonly complete: (href: string) => Effect.Effect<void>
	}
>()('soonlane/DesktopSignIn') {}

export const DesktopSignInLive = Layer.effect(
	DesktopSignIn,
	Effect.gen(function* () {
		const { appUrl } = yield* DesktopConfig
		const mainWindow = yield* MainWindow
		const systemBrowser = yield* SystemBrowser
		// Only in memory: a sign-in that outlives the app has to start again.
		const pendingVerifier = yield* Ref.make(Option.none<string>())

		return DesktopSignIn.of({
			start: Effect.fn('DesktopSignIn.start')(function* (requestedHref) {
				// Reusing a pending verifier lets every browser tab a repeated click opened finish.
				const verifier = Option.getOrElse(
					yield* Ref.get(pendingVerifier),
					createCodeVerifier
				)
				const challenge = yield* Effect.promise(
					async () => await toCodeChallenge(verifier)
				)

				yield* Ref.set(pendingVerifier, Option.some(verifier))

				if (
					!(yield* systemBrowser.open(
						getBrowserSignInUrl(appUrl, challenge, requestedHref)
					))
				)
					yield* Effect.logWarning(
						'The system browser did not open the sign-in'
					)
			}),
			// Logs leave the link out: it carries the code.
			complete: Effect.fn('DesktopSignIn.complete')(function* (href) {
				const code = readSignInCode(href)
				const verifier = code
					? yield* Ref.getAndSet(pendingVerifier, Option.none())
					: Option.none<string>()

				yield* mainWindow.activate

				if (code)
					yield* mainWindow.load(
						getCallbackUrl(appUrl, code, Option.getOrUndefined(verifier))
					)
				else yield* Effect.logWarning('Ignored a link without a sign-in code')
			}),
		})
	})
)
