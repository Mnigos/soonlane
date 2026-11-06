import { account, rateLimit, session, user, verification } from '@soonlane/db'
import { ACCESS_ERROR_MESSAGES } from '@soonlane/domain'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { APIError, createAuthMiddleware, isAPIError } from 'better-auth/api'
import { oAuthProxy } from 'better-auth/plugins/oauth-proxy'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { canSignUp } from './auth-policy.helper'
import { desktopSignIn } from './desktop-sign-in.handler'
import { SIGNED_IN_HINT_COOKIE } from './signed-in-hint.constants'

export const AUTH_BASE_PATH = '/api/auth'

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

export interface OAuthProxyOptions {
	productionUrl: string
	secret?: string
}

export interface CreateAuthOptions {
	database: NodePgDatabase
	baseUrl: string
	trustedOrigins: readonly string[]
	secret: string
	allowedEmails: readonly string[]
	google?: GoogleProviderOptions
	oauthProxy?: OAuthProxyOptions
	log: AuthLogger
}

// Drizzle query errors embed SQL parameters, which include session tokens.
function redactLogArgument(argument: unknown) {
	return argument instanceof Error ? argument.name : argument
}

const RATE_LIMIT_WINDOW_S = 60
const SIGN_IN_RATE_LIMIT = { window: RATE_LIMIT_WINDOW_S, max: 10 }

/**
 * Better Auth for anyone with a verified Google address (optionally only the
 * allowed ones): uuid ids, account deletion, rate limits kept in the
 * database, the signed-in hint cookie, the OAuth proxy that lets Vercel
 * previews sign in through the production callback, and the hand-off of a
 * browser sign-in to the desktop app.
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
		database: drizzleAdapter(options.database, {
			provider: 'pg',
			schema: { account, rateLimit, session, user, verification },
		}),
		advanced: {
			database: { generateId: 'uuid' },
			// Vercel overwrites x-forwarded-for with the client's address, so a client cannot spoof it.
			ipAddress: { ipAddressHeaders: ['x-forwarded-for'] },
		},
		// Each Vercel function instance has its own memory, so the counters live in Postgres.
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
		// Redirect sign-in only: a client-held Google ID token would turn a stale session into a fresh one.
		socialProviders: options.google
			? { google: { ...options.google, disableIdTokenSignIn: true } }
			: {},
		user: { deleteUser: { enabled: true } },
		hooks: {
			after: createAuthMiddleware(async ctx => {
				const attributes = {
					...ctx.context.authCookies.sessionToken.attributes,
					httpOnly: false,
				}

				// Checked first: the session lookup before a sign-out or deletion can refresh the session.
				if (
					ctx.path === '/sign-out' ||
					(ctx.path === '/delete-user' && !isAPIError(ctx.context.returned))
				)
					ctx.setCookie(SIGNED_IN_HINT_COOKIE, '', { ...attributes, maxAge: 0 })
				else if (ctx.context.newSession)
					ctx.setCookie(SIGNED_IN_HINT_COOKIE, '1', {
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
				},
			},
		},
		plugins: [
			// Previews send Google to the production callback, which forwards the encrypted profile back; production skips the proxy for its own sign-ins.
			...(options.oauthProxy
				? [
						oAuthProxy({
							productionURL: options.oauthProxy.productionUrl,
							secret: options.oauthProxy.secret,
						}),
					]
				: []),
			desktopSignIn(),
			// Forwards refreshed session cookies from server-side getSession calls (SSR and RPC); keep it last.
			tanstackStartCookies(),
		],
	})
}

export type Auth = ReturnType<typeof createAuth>
