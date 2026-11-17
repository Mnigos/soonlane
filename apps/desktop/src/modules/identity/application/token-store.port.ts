import { Context, type Effect, type Option } from 'effect'
import type { TokenNotClearedError } from '../domain/sign-in.errors'

/** Where the desktop token outlives the app: the macOS Keychain. */
export class TokenStore extends Context.Service<
	TokenStore,
	{
		readonly load: Effect.Effect<Option.Option<string>>
		readonly save: (token: string) => Effect.Effect<void>
		readonly clear: Effect.Effect<void, TokenNotClearedError>
	}
>()('soonlane/TokenStore') {}
