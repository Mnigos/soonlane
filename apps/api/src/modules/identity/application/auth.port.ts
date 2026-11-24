import type { AuthUser } from '@soonlane/auth'
import type { SignInMethods } from '@soonlane/contracts'
import type { UserId } from '@soonlane/domain'
import { Context } from 'effect'

export interface AuthSession {
	user: AuthUser
}

/** The session of a request and the `Set-Cookie` values its lookup produced (a refresh, or deletions of a dead session), one per cookie. */
export interface SessionLookup {
	session: AuthSession | null
	setCookies: string[]
}

/** A verified MCP access token: the user who allowed the agent, its client, the scopes the token carries and when it was issued, in whole seconds. */
export interface McpAccessToken {
	ownerId: UserId
	clientId: string
	scopes: string[]
	issuedAt: Date
}

export class Auth extends Context.Service<
	Auth,
	{
		readonly handle: (request: Request) => Promise<Response>
		readonly getSession: (headers: Headers) => Promise<SessionLookup>
		/** Decrypts a provider token from the `account` table with Better Auth's own key. */
		readonly readStoredToken: (stored: string) => Promise<string>
		/**
		 * Verifies an MCP request's MCP access token and passes it to `serve`. A request without a valid token, and one `serve` answers `undefined`
		 * for (the connection is gone), get the 401 challenge that sends the agent to sign in.
		 */
		readonly serveMcpRequest: (
			request: Request,
			serve: (token: McpAccessToken) => Promise<Response | undefined>
		) => Promise<Response>
		/** Refreshes a linked account's tokens through its provider, stores the new pair encrypted and returns the access token; rejects with an error whose message is Better Auth's code. */
		readonly refreshStoredToken: (
			userId: UserId,
			accountId: string
		) => Promise<string>
		/** The ways in this server offers, for the sign-in screens. */
		readonly signInMethods: SignInMethods
	}
>()('soonlane/Auth') {}
