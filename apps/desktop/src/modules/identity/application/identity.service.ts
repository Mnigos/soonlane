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
import { AccountNotDeletedError } from '../domain/account-deletion.errors'
import type {
	AccountDeletion,
	DeletingAccount,
} from '../domain/account-deletion.types'
import {
	BrowserNotOpenedError,
	type TokenNotClearedError,
} from '../domain/sign-in.errors'
import { getBrowserSignInUrl } from '../domain/sign-in.helper'
import { deleteAccountOf } from '../infrastructure/account-deletion.helper'
import {
	exchangeSignInCode,
	revokeToken,
} from '../infrastructure/desktop-token.helper'
import { listenForSignInCode } from '../infrastructure/loopback-listener.helper'
import { TokenStore } from './token-store.port'

/** How long the loopback listener waits for the browser: signing in to Google can take a while before the click. */
const SIGN_IN_TIMEOUT = '10 minutes'
/** The deletion's requests take at most 11 more seconds (`account-deletion.helper.ts`), so the page hears how it ended within its 15-second RPC wait. */
const TOKEN_LOCK_TIMEOUT = '2 seconds'

export type SessionEvent =
	| { readonly type: 'token-changed'; readonly token: Option.Option<string> }
	| { readonly type: 'sign-in-failed' }

export class IdentityService extends Context.Service<
	IdentityService,
	{
		/** The desktop token, read from the Keychain at launch. */
		readonly token: Effect.Effect<Option.Option<string>>
		/**
		 * Signs in through the system browser; a newer call cancels the one still
		 * waiting. With `deleting`, the browser asks for a fresh sign-in, and the
		 * page that loads with the new token can take that account back
		 * (`takeDeletionReturn`) to reopen its deletion.
		 */
		readonly signIn: (deleting?: DeletingAccount) => Effect.Effect<void>
		/** Fails when the Keychain keeps the token; the page then reports that signing out failed. */
		readonly signOut: Effect.Effect<void, TokenNotClearedError>
		/**
		 * Deletes the account of `userId` when the server finds the token's session
		 * fresh, then forgets the token as a sign-out does, with nothing left to
		 * revoke. A token the server no longer knows stays, and the page offers
		 * "Deletion not confirmed" with a sign-out. No sign-in stores a token
		 * while it runs, so the token forgotten is the one deleted.
		 */
		readonly deleteAccount: (
			userId: string
		) => Effect.Effect<AccountDeletion, AccountNotDeletedError>
		/** The account the last sign-in was started to delete, once: in memory only, never in a URL or the page's storage. */
		readonly takeDeletionReturn: Effect.Effect<Option.Option<DeletingAccount>>
		/** Every window's page hears about each change. */
		readonly events: Stream.Stream<SessionEvent>
	}
>()('soonlane/IdentityService') {}

export const IdentityServiceLive = Layer.effect(
	IdentityService,
	Effect.gen(function* () {
		const { appUrl, apiUrl } = yield* DesktopConfig
		const tokenStore = yield* TokenStore
		const systemBrowser = yield* SystemBrowser
		const token = yield* Ref.make(yield* tokenStore.load)
		const events = yield* PubSub.unbounded<SessionEvent>()
		const pendingSignIn = yield* FiberHandle.make()
		const deletionReturn = yield* Ref.make(Option.none<DeletingAccount>())
		// Keychain writes cannot be cancelled, so storing a token and signing out never overlap.
		const tokenWrites = yield* Semaphore.make(1)

		const setToken = (next: Option.Option<string>) =>
			Ref.set(token, next).pipe(
				Effect.andThen(
					PubSub.publish(events, { type: 'token-changed', token: next })
				)
			)

		/** A failed revocation (no connection) leaves the session to expire on the server. */
		const revokeQuietly = (revoked: string) =>
			revokeToken(apiUrl, revoked).pipe(
				Effect.catch(error =>
					Effect.logWarning('Could not revoke the desktop session', error.name)
				)
			)

		/**
		 * Called with the permit held once the account is gone. Every page hears
		 * of it before the Keychain write, which has no time limit. A failed
		 * Keychain delete still signs the app out; the dead token fails its next
		 * session read.
		 */
		const forgetToken = Effect.gen(function* () {
			yield* Ref.set(deletionReturn, Option.none())
			yield* setToken(Option.none())
			yield* FiberHandle.clear(pendingSignIn)
			yield* tokenStore.clear.pipe(Effect.catch(() => Effect.void))
		}).pipe(Effect.uninterruptible)

		// The verifier stays in this fiber's memory; a sign-in that outlives the app starts again.
		const signInThroughBrowser = Effect.fn(
			'IdentityService.signInThroughBrowser'
		)(
			function* (deleting: Option.Option<DeletingAccount>) {
				const verifier = createCodeVerifier()
				const challenge = yield* Effect.promise(
					async () => await toCodeChallenge(verifier)
				)
				const listener = yield* listenForSignInCode
				const isOpened = yield* systemBrowser.open(
					getBrowserSignInUrl(appUrl, {
						challenge,
						port: listener.port,
						isFresh: Option.isSome(deleting),
					})
				)

				if (!isOpened) yield* new BrowserNotOpenedError()

				const code = yield* listener.code.pipe(Effect.timeout(SIGN_IN_TIMEOUT))
				const received = yield* exchangeSignInCode(apiUrl, code, verifier)
				const replaced = yield* tokenStore
					.save(received)
					.pipe(
						Effect.andThen(Ref.get(token)),
						Effect.tap(Ref.set(deletionReturn, deleting)),
						Effect.tap(setToken(Option.some(received))),
						Effect.uninterruptible,
						Semaphore.withPermit(tokenWrites)
					)

				// A fresh sign-in replaces a working token, whose session would otherwise outlive it.
				if (Option.isSome(replaced)) yield* revokeQuietly(replaced.value)
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

		return IdentityService.of({
			token: Ref.get(token),
			signIn: deleting =>
				FiberHandle.run(
					pendingSignIn,
					signInThroughBrowser(Option.fromNullishOr(deleting))
				).pipe(Effect.asVoid),
			signOut: Effect.gen(function* () {
				// A sign-in already storing its token holds the permit, so it finishes first and this removes it.
				yield* FiberHandle.clear(pendingSignIn)

				const current = yield* Ref.get(token)

				if (Option.isSome(current)) yield* revokeQuietly(current.value)

				yield* tokenStore.clear
				yield* Ref.set(deletionReturn, Option.none())
				yield* setToken(Option.none())
			}).pipe(
				Semaphore.withPermit(tokenWrites),
				Effect.withSpan('IdentityService.signOut')
			),
			deleteAccount: userId =>
				Effect.gen(function* () {
					yield* Semaphore.takeScoped(tokenWrites, 1).pipe(
						Effect.timeout(TOKEN_LOCK_TIMEOUT)
					)

					const current = yield* Ref.get(token)

					if (Option.isNone(current))
						return { status: 'signed-out' } satisfies AccountDeletion

					const deletion = yield* deleteAccountOf(apiUrl, current.value, userId)

					if (deletion.status === 'deleted') yield* forgetToken

					return deletion
				}).pipe(
					Effect.scoped,
					Effect.catch(error =>
						Effect.logWarning('Could not delete the account', error._tag).pipe(
							Effect.andThen(Effect.fail(new AccountNotDeletedError()))
						)
					),
					Effect.withSpan('IdentityService.deleteAccount')
				),
			takeDeletionReturn: Ref.getAndSet(deletionReturn, Option.none()),
			events: Stream.fromPubSub(events),
		})
	})
)
