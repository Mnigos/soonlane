import type { AuthUser } from '@soonlane/auth'
import type { SignInMethods } from '@soonlane/contracts'
import { Context } from 'effect'

export interface AuthSession {
	user: AuthUser
}

/** The session of a request and the `Set-Cookie` values its lookup produced (a refresh, or deletions of a dead session), one per cookie. */
export interface SessionLookup {
	session: AuthSession | null
	setCookies: string[]
}

export class Auth extends Context.Service<
	Auth,
	{
		readonly handle: (request: Request) => Promise<Response>
		readonly getSession: (headers: Headers) => Promise<SessionLookup>
		/** Decrypts a provider token from the `account` table with Better Auth's own key. */
		readonly readStoredToken: (stored: string) => Promise<string>
		/** The ways in this server offers, for the sign-in screens. */
		readonly signInMethods: SignInMethods
	}
>()('soonlane/Auth') {}
