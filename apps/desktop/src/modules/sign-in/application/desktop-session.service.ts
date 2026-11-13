import { createCodeVerifier, toCodeChallenge } from '@soonlane/auth'
import {
	Cause,
	Context,
	Effect,
	FiberHandle,
	Layer,
	Option,
	PubSub,
	Ref,
	Semaphore,
	Stream,
} from 'effect'
import { DesktopConfig } from '../../../platform/config/desktop.config'
import { SystemBrowser } from '../../navigation/application/system-browser.port'
import { SIGN_IN_TIMEOUT } from '../domain/sign-in.constants'
import {
	BrowserNotOpenedError,
	type TokenNotClearedError,
} from '../domain/sign-in.errors'
import { getBrowserSignInUrl } from '../domain/sign-in.helper'
import {
	exchangeSignInCode,
	revokeToken,
} from '../infrastructure/desktop-token.helper'
import { listenForSignInCode } from '../infrastructure/loopback-listener.helper'
import { TokenStore } from './token-store.port'

export type SessionEvent =
	| { readonly type: 'token-changed'; readonly token: Option.Option<string> }
	| { readonly type: 'sign-in-failed' }

export class DesktopSession extends Context.Service<
	DesktopSession,
	{
		/** The desktop token, read from the Keychain at launch. */
		readonly token: Effect.Effect<Option.Option<string>>
		/** Signs in through the system browser; a newer call cancels the one still waiting. */
		readonly signIn: Effect.Effect<void>
		/** Fails when the Keychain keeps the token; the page then reports that signing out failed. */
		readonly signOut: Effect.Effect<void, TokenNotClearedError>
		/** Every window's page hears about each change. */
		readonly events: Stream.Stream<SessionEvent>
	}
>()('soonlane/DesktopSession') {}

export const DesktopSessionLive = Layer.effect(
	DesktopSession,
	Effect.gen(function* () {
		const { appUrl, apiUrl } = yield* DesktopConfig
		const tokenStore = yield* TokenStore
		const systemBrowser = yield* SystemBrowser
		const token = yield* Ref.make(yield* tokenStore.load)
		const events = yield* PubSub.unbounded<SessionEvent>()
		const pendingSignIn = yield* FiberHandle.make()
		// Keychain writes cannot be cancelled, so storing a token and signing out never overlap.
		const tokenWrites = yield* Semaphore.make(1)

		const setToken = (next: Option.Option<string>) =>
			Ref.set(token, next).pipe(
				Effect.andThen(
					PubSub.publish(events, { type: 'token-changed', token: next })
				)
			)

		// The verifier stays in this fiber's memory; a sign-in that outlives the app starts again.
		const signInThroughBrowser = Effect.fn(
			'DesktopSession.signInThroughBrowser'
		)(
			function* () {
				const verifier = createCodeVerifier()
				const challenge = yield* Effect.promise(
					async () => await toCodeChallenge(verifier)
				)
				const listener = yield* listenForSignInCode
				const isOpened = yield* systemBrowser.open(
					getBrowserSignInUrl(appUrl, { challenge, port: listener.port })
				)

				if (!isOpened) yield* new BrowserNotOpenedError()

				const code = yield* listener.code.pipe(Effect.timeout(SIGN_IN_TIMEOUT))
				const received = yield* exchangeSignInCode(apiUrl, code, verifier)

				yield* tokenStore
					.save(received)
					.pipe(
						Effect.andThen(setToken(Option.some(received))),
						Effect.uninterruptible,
						Semaphore.withPermit(tokenWrites)
					)
			},
			Effect.scoped,
			// A newer sign-in or a sign-out interrupts this one, which is no failure to report.
			Effect.catchCause(cause =>
				Cause.hasInterruptsOnly(cause)
					? Effect.failCause(cause)
					: Effect.logWarning('Desktop sign-in failed', cause).pipe(
							Effect.andThen(PubSub.publish(events, { type: 'sign-in-failed' }))
						)
			)
		)

		return DesktopSession.of({
			token: Ref.get(token),
			signIn: FiberHandle.run(pendingSignIn, signInThroughBrowser()).pipe(
				Effect.asVoid
			),
			signOut: Effect.gen(function* () {
				// A sign-in already storing its token holds the permit, so it finishes first and this removes it.
				yield* FiberHandle.clear(pendingSignIn)

				const current = yield* Ref.get(token)

				// A revocation that fails (no connection) still signs the app out; the session expires on the server.
				if (Option.isSome(current))
					yield* revokeToken(apiUrl, current.value).pipe(
						Effect.catch(error =>
							Effect.logWarning(
								'Could not revoke the desktop session',
								error.name
							)
						)
					)

				yield* tokenStore.clear
				yield* setToken(Option.none())
			}).pipe(
				Semaphore.withPermit(tokenWrites),
				Effect.withSpan('DesktopSession.signOut')
			),
			events: Stream.fromPubSub(events),
		})
	})
)
