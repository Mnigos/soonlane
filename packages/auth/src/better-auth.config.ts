import { account, rateLimit, session, user, verification } from '@soonlane/db'
import { ACCESS_ERROR_MESSAGES } from '@soonlane/domain'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { APIError, createAuthMiddleware, isAPIError } from 'better-auth/api'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { canSignUp } from './auth-policy.helper'
import { DESKTOP_EXCHANGE_PATH, desktopSignIn } from './desktop-sign-in.handler'
import { returnAddresses } from './return-address.handler'
import type { SignInMethod } from './sign-in-method.types'
import { getSignedInHintCookie } from './signed-in-hint.helper'

export const AUTH_BASE_PATH = '/api/auth'
/** The one header Better Auth reads the client IP from; the API's HTTP entry sets it and drops any copy a client sends. */
export const CLIENT_IP_HEADER = 'x-soonlane-client-ip'

export type AuthLogLevel = 'debug' | 'info' | 'warn' | 'error'

export type AuthLogger = (
	level: AuthLogLevel,
	message: unknown,
	...args: unknown[]
) => void

export interface GoogleProviderOptions {
	clientId: string
	clientSecret: string
}

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
}

export interface CreateAuthOptions {
	database: NodePgDatabase
	/** The API's origin. */
	baseUrl: string
	/** The web origins that may call the API and receive the user back after sign-in; exact origins only. */
	trustedOrigins: readonly string[]
	/** Names every cookie of the environment (`<prefix>.session_token`), so production's and staging's never share a name. */
	cookiePrefix: string
	/** The registrable domain the cookies cover (`soonlane.com`); unset, they stay on the API's host, as on localhost. */
	cookieDomain?: string
	/** Where Better Auth sends the browser after an error it cannot return to the app itself. */
	errorUrl: string
	secret: string
	allowedEmails: readonly string[]
	google: GoogleProviderOptions
	log: AuthLogger
	events: AuthEvents
}

/** Drizzle query errors embed SQL parameters, which include session tokens. */
function redactLogArgument(argument: unknown) {
	return argument instanceof Error ? argument.name : argument
}

const RATE_LIMIT_WINDOW_S = 60
const SIGN_IN_RATE_LIMIT = { window: RATE_LIMIT_WINDOW_S, max: 10 }
/**
 * Better Auth for anyone with a verified Google address. `allowedEmails`, when
 * set, limits who can create an account; existing accounts keep signing in.
 * Also uuid ids, account deletion, rate limits kept in the database, the
 * signed-in hint cookie and the hand-off of a browser sign-in to the desktop
 * app.
 */
export function createAuth(options: CreateAuthOptions) {
	return betterAuth({
		appName: 'Soonlane',
		logger: {
			log: (level, message, ...args: unknown[]) =>
				options.log(
					level,
					`[Better Auth] ${String(redactLogArgument(message))}`,
					...args.map(redactLogArgument)
				),
		},
		secret: options.secret,
		baseURL: options.baseUrl,
		basePath: AUTH_BASE_PATH,
		trustedOrigins: [...options.trustedOrigins],
		onAPIError: { errorURL: options.errorUrl },
		database: drizzleAdapter(options.database, {
			provider: 'pg',
			schema: { account, rateLimit, session, user, verification },
		}),
		advanced: {
			database: { generateId: 'uuid' },
			cookiePrefix: options.cookiePrefix,
			crossSubDomainCookies: options.cookieDomain
				? { enabled: true, domain: options.cookieDomain }
				: undefined,
			ipAddress: { ipAddressHeaders: [CLIENT_IP_HEADER] },
		},
		// Counters live in Postgres, so they survive deploys and hold across replicas.
		rateLimit: {
			enabled: true,
			storage: 'database',
			window: RATE_LIMIT_WINDOW_S,
			max: 100,
			customRules: {
				'/sign-in/social': SIGN_IN_RATE_LIMIT,
				'/desktop-sign-in/code': SIGN_IN_RATE_LIMIT,
				'/desktop-sign-in/exchange': SIGN_IN_RATE_LIMIT,
				'/delete-user': { window: 3600, max: 5 },
			},
		},
		// A client-held Google ID token would turn a stale session into a fresh one.
		socialProviders: {
			google: { ...options.google, disableIdTokenSignIn: true },
		},
		user: { deleteUser: { enabled: true } },
		hooks: {
			after: createAuthMiddleware(async ctx => {
				const hintCookie = getSignedInHintCookie(options.cookiePrefix)
				const attributes = {
					...ctx.context.authCookies.sessionToken.attributes,
					httpOnly: false,
				}

				// Checked first: a sign-out or deletion can also refresh the session.
				if (
					ctx.path === '/sign-out' ||
					(ctx.path === '/delete-user' && !isAPIError(ctx.context.returned))
				)
					ctx.setCookie(hintCookie, '', { ...attributes, maxAge: 0 })
				else if (ctx.context.newSession)
					ctx.setCookie(hintCookie, '1', {
						...attributes,
						maxAge: ctx.context.sessionConfig.expiresIn,
					})
			}),
		},
		databaseHooks: {
			user: {
				create: {
					before: async candidate => {
						if (!canSignUp(candidate, options.allowedEmails))
							throw new APIError('FORBIDDEN', {
								code: 'SIGN_UPS_CLOSED',
								message: ACCESS_ERROR_MESSAGES.SIGN_UPS_CLOSED,
							})

						return { data: candidate }
					},
					after: async (created, context) =>
						await options.events.userCreated(created, context?.headers),
				},
			},
			session: {
				create: {
					after: async ({ userId }, context) =>
						await options.events.sessionCreated(
							userId,
							context?.path === DESKTOP_EXCHANGE_PATH ? 'desktop' : 'google',
							context?.headers
						),
				},
			},
		},
		plugins: [desktopSignIn(), returnAddresses(options.trustedOrigins)],
	})
}

export type Auth = ReturnType<typeof createAuth>
