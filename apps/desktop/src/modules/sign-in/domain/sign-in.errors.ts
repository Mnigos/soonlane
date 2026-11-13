import { Data } from 'effect'

/** The Keychain kept the token: signing out cannot claim success, or a relaunch would sign the app back in. */
export class TokenNotClearedError extends Data.TaggedError(
	'TokenNotClearedError'
) {}

export class BrowserNotOpenedError extends Data.TaggedError(
	'BrowserNotOpenedError'
) {}
