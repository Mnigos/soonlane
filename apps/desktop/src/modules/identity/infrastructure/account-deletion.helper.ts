import {
	AUTH_BASE_PATH,
	GOOGLE_LOGIN_NOT_RENEWED,
	readReauth,
} from '@soonlane/auth'
import { Effect, Option, Schema } from 'effect'
import { AccountNotDeletedError } from '../domain/account-deletion.errors'
import type { AccountDeletion } from '../domain/account-deletion.types'

/** Never refreshes the session, so the check writes nothing on the server. */
const SESSION_LOOKUP_PATH = '/get-session?disableRefresh=true'
/** Better Auth's reply once the user is gone; with an email step configured it would answer otherwise and delete nothing. */
const USER_DELETED = 'User deleted'
/**
 * With the service's 2-second wait for the token lock, these add up to 13
 * seconds, under the page's 15-second RPC wait: the lookup, the deletion, and
 * the second lookup after a deletion that got no readable reply.
 */
const LOOKUP_TIMEOUT = '3 seconds'
const DELETION_TIMEOUT = '6 seconds'
const RECHECK_TIMEOUT = '2 seconds'
const decodeSessionOwner = Schema.decodeUnknownEffect(
	Schema.NullOr(
		Schema.Struct({
			user: Schema.Struct({ id: Schema.String, email: Schema.String }),
		})
	)
)
const decodeDeletionReply = Schema.decodeUnknownEffect(
	Schema.Struct({
		message: Schema.optional(Schema.String),
		code: Schema.optional(Schema.String),
		reason: Schema.optional(Schema.String),
		reauth: Schema.optional(Schema.Unknown),
	})
)

interface TokenRequest {
	method: 'GET' | 'POST'
	path: string
	token: string
}

function requestWithToken(apiUrl: URL, { method, path, token }: TokenRequest) {
	return Effect.tryPromise(async signal => {
		const response = await fetch(new URL(`${AUTH_BASE_PATH}${path}`, apiUrl), {
			method,
			headers: {
				authorization: `Bearer ${token}`,
				...(method === 'POST' && { 'content-type': 'application/json' }),
			},
			body: method === 'POST' ? '{}' : undefined,
			signal,
		})

		return { isOk: response.ok, body: (await response.json()) as unknown }
	})
}

/** The user the token's session belongs to, or `null` when the server has no session for it. */
const readSessionOwner = Effect.fn('IdentityService.readSessionOwner')(
	function* (apiUrl: URL, token: string) {
		const lookup = yield* requestWithToken(apiUrl, {
			method: 'GET',
			path: SESSION_LOOKUP_PATH,
			token,
		})

		// Only the status: an error body could echo the request.
		if (!lookup.isOk) return yield* new AccountNotDeletedError()

		return yield* decodeSessionOwner(lookup.body)
	}
)

/**
 * After a deletion request that went out but got no readable reply, one more
 * lookup decides: only a session still owned by `userId` means the account
 * stayed. A gone session, or a lookup that fails too, ends `signed-out`, since
 * the app cannot tell whether the account went; the request is never sent
 * again.
 */
const settleUnansweredDeletion = Effect.fn(
	'IdentityService.settleUnansweredDeletion'
)(function* (apiUrl: URL, token: string, userId: string) {
	const remaining = yield* readSessionOwner(apiUrl, token).pipe(
		Effect.timeout(RECHECK_TIMEOUT),
		Effect.option
	)

	if (Option.isSome(remaining) && remaining.value?.user.id === userId)
		return yield* new AccountNotDeletedError()

	return { status: 'signed-out' } satisfies AccountDeletion
})

/**
 * Deletes the account of `userId` with this desktop token, once the server
 * says the token's session belongs to that user. The lookup and the deletion
 * carry the same token, whose session cannot change hands in between, so no
 * other user is ever deleted.
 */
export const deleteAccountOf = Effect.fn('IdentityService.deleteAccountOf')(
	function* (apiUrl: URL, token: string, userId: string) {
		const owner = yield* readSessionOwner(apiUrl, token).pipe(
			Effect.timeout(LOOKUP_TIMEOUT)
		)

		if (!owner) return { status: 'signed-out' } satisfies AccountDeletion
		if (owner.user.id !== userId)
			return {
				status: 'signed-in-as',
				email: owner.user.email,
			} satisfies AccountDeletion

		const deletion = yield* requestWithToken(apiUrl, {
			method: 'POST',
			path: '/delete-user',
			token,
		}).pipe(
			Effect.timeout(DELETION_TIMEOUT),
			Effect.flatMap(({ isOk, body }) =>
				Effect.map(decodeDeletionReply(body), reply => ({ isOk, reply }))
			),
			Effect.option
		)

		if (Option.isNone(deletion))
			return yield* settleUnansweredDeletion(apiUrl, token, userId)

		const { isOk, reply } = deletion.value

		if (isOk && reply.message === USER_DELETED)
			return { status: 'deleted' } satisfies AccountDeletion
		if (reply.code === 'SESSION_EXPIRED')
			return {
				status: 'needs-fresh-sign-in',
				reauth: readReauth(reply),
				isGoogleLoginStale: reply.reason === GOOGLE_LOGIN_NOT_RENEWED,
			} satisfies AccountDeletion

		return yield* new AccountNotDeletedError()
	}
)
