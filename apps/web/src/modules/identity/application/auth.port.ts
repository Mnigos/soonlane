import type { AuthUser } from '@soonlane/auth'
import { Context } from 'effect'

export interface AuthSession {
	user: AuthUser
}

export class Auth extends Context.Service<
	Auth,
	{
		readonly configured: boolean
		readonly handle: (request: Request) => Promise<Response>
		readonly getSession: (headers: Headers) => Promise<AuthSession | null>
	}
>()('soonlane/Auth') {}
