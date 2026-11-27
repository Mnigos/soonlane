import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type { EmailCodeOptions } from './email-code.handler'
import type { OAuthClientOptions } from './oauth-client.types'
import type { SignInMethod } from './sign-in-method.types'

export type AuthLogLevel = 'debug' | 'info' | 'warn' | 'error'

export type AuthLogger = (
	level: AuthLogLevel,
	message: unknown,
	...args: unknown[]
) => void

/** `headers` are the request's, when it came over HTTP. */
export interface AuthEvents {
	userCreated: (
		user: { id: string; createdAt: Date },
		headers?: Headers
	) => Promise<void>
	sessionCreated: (
		userId: string,
		method: SignInMethod,
		headers?: Headers
	) => Promise<void>
	/** Runs when `/delete-user` has passed its checks, before anything of the user is deleted; a rejection keeps the account whole. */
	userDeleting: (userId: string) => Promise<void>
}

export interface CreateAuthOptions {
	database: NodePgDatabase
	/** The API's origin. */
	baseUrl: string
	/** The web app's origin; its `/login` page also shows the errors Better Auth cannot return to the app itself. */
	appUrl: string
	/** Lets agents register themselves without a verified web address (`McpAuthorizationOptions.dynamicRegistration`). */
	dynamicMcpRegistration?: boolean
	/** The web origins that may call the API and receive the user back after sign-in; exact origins only. */
	trustedOrigins: readonly string[]
	/** Development only: Expo Go's `exp:` links also count as the mobile app's return addresses. */
	trustExpoGo?: boolean
	/** Names every cookie of the environment (`<prefix>.session_token`), so production's and staging's never share a name. */
	cookiePrefix: string
	/** The registrable domain the cookies cover (`soonlane.com`); unset, they stay on the API's host, as on localhost. */
	cookieDomain?: string
	secret: string
	allowedEmails: readonly string[]
	/** Unset, nobody signs in with Google. */
	google?: OAuthClientOptions
	/** Unset, nobody signs in with an email code. */
	emailCode?: EmailCodeOptions
	/** Unset, Todoist cannot be linked. */
	todoist?: OAuthClientOptions
	/** Unset, Linear cannot be linked. */
	linear?: OAuthClientOptions
	log: AuthLogger
	events: AuthEvents
}
