import { account, rateLimit, session, user, verification } from '@soonlane/db'
import { ACCESS_ERROR_MESSAGES } from '@soonlane/domain'
import { type BetterAuthPlugin, betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import {
	APIError,
	createAuthMiddleware,
	getSessionFromCtx,
	isAPIError,
} from 'better-auth/api'
import { symmetricDecrypt } from 'better-auth/crypto'
import { bearer } from 'better-auth/plugins'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { canSignUp } from './auth-policy.helper'
import {
	DESKTOP_EXCHANGE_PATH,
	DESKTOP_TOKEN_PATH,
	desktopSignIn,
} from './desktop-sign-in.handler'
import type { OAuthClientOptions } from './oauth-client.types'
import { returnAddresses } from './return-address.handler'
import type { SignInMethod } from './sign-in-method.types'
import { getSignedInHintCookie } from './signed-in-hint.helper'
import { todoistLink } from './todoist-link.handler'
import {
	TODOIST_PROVIDER_ID,
	TODOIST_STILL_CONNECTED,
} from './todoist.constants'

export const AUTH_BASE_PATH = '/api/auth'
/** The one header Better Auth reads the client IP from; the API's HTTP entry sets it and drops any copy a client sends. */
export const CLIENT_IP_HEADER = 'x-soonlane-client-ip'

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
	/** Session lookups through `auth.api.getSession` neither refresh nor delete a session; set while the API refuses writes. */
	readOnlySessions?: boolean
	google: OAuthClientOptions
	/** Unset, Todoist cannot be linked. */
	todoist?: OAuthClientOptions
	log: AuthLogger
	events: AuthEvents
}

/** RFC 6749 and RFC 7009 error codes; any other text in a provider's response stays out of the logs. */
const OAUTH_ERROR_CODES = new Set<unknown>([
	'invalid_request',
	'invalid_client',
	'invalid_grant',
	'unauthorized_client',
	'unsupported_grant_type',
	'invalid_scope',
	'unsupported_token_type',
	'access_denied',
	'server_error',
	'temporarily_unavailable',
])

/** Drizzle query errors embed SQL parameters, which include session tokens, and a provider's failed response arrives as a plain object holding its body: an error becomes its name, any other object a known OAuth error code and its numeric status at most. */
function redactLogArgument(argument: unknown) {
	if (argument instanceof Error) return argument.name
	if (typeof argument !== 'object' || argument === null) return argument

	const code =
		'error' in argument && OAUTH_ERROR_CODES.has(argument.error)
			? String(argument.error)
			: '[object]'

	return 'status' in argument && typeof argument.status === 'number'
		? `${code} ${argument.status}`
		: code
}

const RATE_LIMIT_WINDOW_S = 60
const SIGN_IN_RATE_LIMIT = { window: RATE_LIMIT_WINDOW_S, max: 10 }
/** Endpoints that hand a stored provider token to the browser or remove a linked account; the app uses none of them, and the API reads tokens server-side. */
const DISABLED_PATHS = [
	'/get-access-token',
	'/refresh-token',
	'/account-info',
	'/unlink-account',
]

function readProvider(body: unknown) {
	return typeof body === 'object' && body !== null && 'provider' in body
		? body.provider
		: undefined
}

/** What the web app sends; anything more could widen the scope or the authorize URL. */
const TODOIST_LINK_BODY_KEYS = new Set([
	'provider',
	'callbackURL',
	'errorCallbackURL',
])

function readBodyKeys(body: unknown) {
	return typeof body === 'object' && body !== null ? Object.keys(body) : []
}

/**
 * Better Auth's `bearer` without its after hook, which copies the session
 * cookie of every response that sets one into a `set-auth-token` header it
 * exposes to scripts, so the web app's HttpOnly cookie would reach page code.
 * The desktop app gets its token from `/desktop-sign-in/token` instead.
 * `requireSignature` refuses a bare session token, which would otherwise pass.
 */
function bearerSessions() {
	const { id, hooks } = bearer({ requireSignature: true })

	return { id, hooks: { before: hooks.before } } satisfies BetterAuthPlugin
}

function refuse(message: string) {
	return new APIError('FORBIDDEN', { code: 'PROVIDER_NOT_ALLOWED', message })
}
/**
 * Better Auth for anyone with a verified Google address. `allowedEmails`, when
 * set, limits who can create an account; existing accounts keep signing in.
 * Also uuid ids, account deletion, rate limits kept in the database, the
 * signed-in hint cookie, the hand-off of a browser sign-in to the desktop
 * app with the signed bearer token its session uses and, when configured, linking Todoist for an import: Todoist is only
 * linked, Google only signs in, and provider tokens are stored encrypted.
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
		disabledPaths: DISABLED_PATHS,
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
				'/link-social': SIGN_IN_RATE_LIMIT,
				'/desktop-sign-in/code': SIGN_IN_RATE_LIMIT,
				[DESKTOP_EXCHANGE_PATH]: SIGN_IN_RATE_LIMIT,
				[DESKTOP_TOKEN_PATH]: SIGN_IN_RATE_LIMIT,
				'/delete-user': { window: 3600, max: 5 },
			},
		},
		// A client-held Google ID token would turn a stale session into a fresh one.
		socialProviders: {
			google: { ...options.google, disableIdTokenSignIn: true },
		},
		user: { deleteUser: { enabled: true } },
		// Deferred refresh makes a server-side (GET) lookup skip both writes; it changes nothing else in this setup.
		session: { deferSessionRefresh: options.readOnlySessions },
		// Todoist reports no verified email; its user info carries the linking user's own address.
		account: {
			encryptOAuthTokens: true,
			accountLinking: { trustedProviders: [TODOIST_PROVIDER_ID] },
		},
		hooks: {
			before: createAuthMiddleware(async ctx => {
				const provider = readProvider(ctx.body)

				if (ctx.path === '/sign-in/social' && provider === TODOIST_PROVIDER_ID)
					throw refuse('Todoist can only be linked to a signed-in account.')
				if (ctx.path !== '/link-social') return
				if (provider !== TODOIST_PROVIDER_ID)
					throw refuse('Only Todoist can be linked.')
				if (
					readBodyKeys(ctx.body).some(key => !TODOIST_LINK_BODY_KEYS.has(key))
				)
					throw refuse('A Todoist link takes no other parameters.')

				const signedIn = await getSessionFromCtx(ctx)
				const linked = signedIn
					? await ctx.context.internalAdapter.findAccounts(signedIn.user.id)
					: []

				// A new link must not overwrite a row whose tokens are not revoked yet; the 15 minutes count from each row's creation.
				if (linked.some(({ providerId }) => providerId === TODOIST_PROVIDER_ID))
					throw new APIError('CONFLICT', {
						code: TODOIST_STILL_CONNECTED,
						message: 'The earlier Todoist connection is still open.',
					})
			}),
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
			// Backs the `/link-social` check against two links racing: the later callback's tokens are revoked instead.
			account: {
				update: {
					before: async ({ providerId }) => providerId !== TODOIST_PROVIDER_ID,
				},
			},
			session: {
				create: {
					after: async ({ userId }, context) =>
						await options.events.sessionCreated(
							userId,
							context?.path === DESKTOP_EXCHANGE_PATH ||
								context?.path === DESKTOP_TOKEN_PATH
								? 'desktop'
								: 'google',
							context?.headers
						),
				},
			},
		},
		plugins: [
			bearerSessions(),
			desktopSignIn(),
			returnAddresses(options.trustedOrigins),
			...(options.todoist ? [todoistLink(options.todoist)] : []),
		],
	})
}

export type Auth = ReturnType<typeof createAuth>

/** A provider token Better Auth stored with `encryptOAuthTokens`, decrypted with its own key and cipher (what its `decryptOAuthToken` runs). */
export async function readStoredOAuthToken(auth: Auth, stored: string) {
	const { secretConfig } = await auth.$context

	return await symmetricDecrypt({ key: secretConfig, data: stored })
}
