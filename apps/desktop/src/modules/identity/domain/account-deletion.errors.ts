import { Data } from 'effect'

/** The deletion request failed or got an answer it does not know; the account and the token stay as they were, as far as the app can tell. */
export class AccountNotDeletedError extends Data.TaggedError(
	'AccountNotDeletedError'
) {}
