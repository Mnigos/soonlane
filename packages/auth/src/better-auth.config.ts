import { account, session, user, verification } from '@soonlane/db'
import { ACCESS_ERROR_MESSAGES } from '@soonlane/domain'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { APIError } from 'better-auth/api'
import { oAuthProxy } from 'better-auth/plugins/oauth-proxy'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { canSignUp } from './auth-policy.helper'
import { desktopSignIn } from './desktop-sign-in.handler'

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

/**
 * Better Auth for anyone with a verified Google address (optionally only the
 * allowed ones): uuid ids, the OAuth proxy that lets Vercel previews sign in
 * through the production callback, and the hand-off of a browser sign-in to
 * the desktop app.
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
			schema: { account, session, user, verification },
		}),
		advanced: { database: { generateId: 'uuid' } },
		socialProviders: options.google ? { google: options.google } : {},
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
