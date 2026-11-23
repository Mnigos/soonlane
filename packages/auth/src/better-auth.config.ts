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
import {
	GOOGLE_AUTH_TIME_CLAIMS,
	isBearerRequest,
	refuseStaleDeletion,
} from './account-deletion.handler'
import { androidSignIn } from './android-sign-in.handler'
import { canSignUp } from './auth-policy.helper'
import type { CreateAuthOptions } from './create-auth.types'
import { AUTH_BASE_PATH, DESKTOP_TOKEN_PATH } from './desktop-sign-in.constants'
import { desktopSignIn } from './desktop-sign-in.handler'
import {
	EMAIL_CODE_SEND_PATH,
	EMAIL_CODE_SIGN_IN_PATH,
} from './email-code.constants'
import { emailCodeSignIn, UNUSED_EMAIL_CODE_PATHS } from './email-code.handler'
import {
	EXPO_GO_SCHEME,
	MOBILE_APP_SCHEME,
	expoSignIn,
	isPendingAppSignIn,
} from './expo-sign-in.handler'
import { refuseUnvouchedGoogleLink } from './google-link.handler'
import { redactLogArgument } from './log-redaction.helper'
import {
	MCP_AUTHORIZATION_SCHEMA,
	mcpAuthorization,
	UNUSED_MCP_AUTHORIZATION_PATHS,
} from './mcp-authorization.handler'
import {
	ANDROID_EXCHANGE_PATH,
	EXPO_PROXY_PATH,
} from './mobile-sign-in.constants'
import { returnAddresses } from './return-address.handler'
import type { SignInMethod } from './sign-in-method.types'
import { getSignedInHintCookie } from './signed-in-hint.helper'
import { todoistLink } from './todoist-link.handler'
import {
	TODOIST_PROVIDER_ID,
	TODOIST_STILL_CONNECTED,
} from './todoist.constants'

export type {
	AuthEvents,
	AuthLogger,
	AuthLogLevel,
	CreateAuthOptions,
} from './create-auth.types'
export type { SignInCodeMail } from './email-code.handler'

/** The one header Better Auth reads the client IP from; the API's HTTP entry sets it and drops any copy a client sends. */
export const CLIENT_IP_HEADER = 'x-soonlane-client-ip'
const RATE_LIMIT_WINDOW_S = 60
const SIGN_IN_RATE_LIMIT = { window: RATE_LIMIT_WINDOW_S, max: 10 }
/** Endpoints that hand a stored provider token to the browser or remove a linked account, which the app does not use (the API reads tokens server-side), and the emailOTP endpoints it does not use. */
const DISABLED_PATHS = [
	'/get-access-token',
	'/refresh-token',
	'/account-info',
	'/unlink-account',
	...UNUSED_EMAIL_CODE_PATHS,
	...UNUSED_MCP_AUTHORIZATION_PATHS,
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

/** `requireSignature` refuses a bare session token, which would otherwise pass. */
const signedBearer = bearer({ requireSignature: true })

/**
 * Better Auth's `bearer` without its after hook, which copies the session
 * cookie of every response that sets one into a `set-auth-token` header it
 * exposes to scripts, so the web app's HttpOnly cookie would reach page code.
 * The desktop app gets its token from `/desktop-sign-in/token` instead.
 */
function bearerSessions() {
	return {
		id: signedBearer.id,
		hooks: { before: signedBearer.hooks.before },
	} satisfies BetterAuthPlugin
}

/** A token exchange is the desktop app's and a cookie exchange the Android app's; the label only names the analytics method. */
function toSignInMethod(path?: string): SignInMethod {
	if (path === DESKTOP_TOKEN_PATH) return 'desktop'
	if (path === ANDROID_EXCHANGE_PATH) return 'mobile'
	if (path === EMAIL_CODE_SIGN_IN_PATH) return 'email'

	return path?.startsWith('/callback/') ? 'google' : 'other'
}

function refuse(message: string) {
	return new APIError('FORBIDDEN', { code: 'PROVIDER_NOT_ALLOWED', message })
}
/**
 * Better Auth for anyone with a verified Google address or a mailbox that
 * receives a sign-in code; either method may be off, not both. `allowedEmails`, when
 * set, limits who can create an account; existing accounts keep signing in.
 * Also uuid ids, account deletion, rate limits kept in the database, the
 * signed-in hint cookie, the hand-off of a browser sign-in to the desktop
 * app with the signed bearer token its session uses, and to the Android
 * app through a verified App Link, the iPhone app's sign-in through Better
 * Auth's Expo plugin and, when configured,
 * linking Todoist for an import: Todoist is only linked, Google only signs
 * in, and provider tokens are stored encrypted.
 */
export function createAuth(options: CreateAuthOptions) {
	const appSchemes = options.trustExpoGo
		? [MOBILE_APP_SCHEME, EXPO_GO_SCHEME]
		: [MOBILE_APP_SCHEME]

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
		trustedOrigins: [
			...options.trustedOrigins,
			...appSchemes.map(scheme => `${scheme}//`),
		],
		disabledPaths: DISABLED_PATHS,
		onAPIError: { errorURL: `${options.appUrl}/login` },
		database: drizzleAdapter(options.database, {
			provider: 'pg',
			schema: {
				account,
				rateLimit,
				session,
				user,
				verification,
				...MCP_AUTHORIZATION_SCHEMA,
			},
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
				[DESKTOP_TOKEN_PATH]: SIGN_IN_RATE_LIMIT,
				[ANDROID_EXCHANGE_PATH]: SIGN_IN_RATE_LIMIT,
				[EXPO_PROXY_PATH]: SIGN_IN_RATE_LIMIT,
				[EMAIL_CODE_SEND_PATH]: { window: RATE_LIMIT_WINDOW_S, max: 3 },
				[EMAIL_CODE_SIGN_IN_PATH]: SIGN_IN_RATE_LIMIT,
				'/delete-user': { window: 3600, max: 5 },
			},
		},
		// A client-held Google ID token would turn a stale session into a fresh one.
		socialProviders: options.google && {
			google: { ...options.google, disableIdTokenSignIn: true },
		},
		session: {
			// Set only by the session-create hook and the hand-off, never by a client.
			additionalFields: {
				emailCodeAt: { type: 'date', required: false, input: false },
			},
		},
		user: {
			deleteUser: {
				enabled: true,
				// Not the user delete database hook: Better Auth deletes the sessions and accounts before that one runs.
				beforeDelete: async ({ id }) => await options.events.userDeleting(id),
			},
			validateUserInfo: refuseUnvouchedGoogleLink(Boolean(options.emailCode)),
		},
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
				// Set here rather than by the clients, so app builds already installed ask for it too.
				if (ctx.path === '/sign-in/social' && provider === 'google')
					return {
						context: {
							body: { additionalParams: { claims: GOOGLE_AUTH_TIME_CLAIMS } },
						},
					}
				if (ctx.path === '/delete-user')
					return await refuseStaleDeletion(
						ctx,
						signedBearer.hooks.before,
						{
							google: Boolean(options.google),
							emailCode: Boolean(options.emailCode),
						},
						options.log
					)
				if (
					ctx.path === EXPO_PROXY_PATH &&
					!(await isPendingAppSignIn(
						ctx.context.internalAdapter,
						ctx.query?.authorizationURL,
						appSchemes
					))
				)
					throw refuse('Only a Google sign-in opens from the mobile app.')
				if (ctx.path !== '/link-social') return
				// The desktop app links Todoist in the browser.
				if (isBearerRequest(ctx))
					throw refuse('Todoist can only be linked from the browser.')
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
					before: async (created, context) =>
						context?.path === EMAIL_CODE_SIGN_IN_PATH
							? { data: { ...created, emailCodeAt: new Date() } }
							: { data: created },
					after: async ({ userId }, context) =>
						await options.events.sessionCreated(
							userId,
							toSignInMethod(context?.path),
							context?.headers
						),
				},
			},
		},
		plugins: [
			bearerSessions(),
			desktopSignIn(),
			androidSignIn(),
			returnAddresses(options.trustedOrigins, appSchemes),
			...(options.todoist ? [todoistLink(options.todoist)] : []),
			...(options.emailCode
				? emailCodeSignIn({
						database: options.database,
						secret: options.secret,
						allowedEmails: options.allowedEmails,
						emailCode: options.emailCode,
					})
				: []),
			...mcpAuthorization({
				baseUrl: options.baseUrl,
				appUrl: options.appUrl,
				dynamicRegistration: options.dynamicMcpRegistration ?? false,
			}),
			// Last, so its after hook strips the browser's cookies after every other plugin's callback hook.
			expoSignIn(appSchemes),
		],
	})
}

export type Auth = ReturnType<typeof createAuth>

/** A provider token Better Auth stored with `encryptOAuthTokens`, decrypted with its own key and cipher (what its `decryptOAuthToken` runs). */
export async function readStoredOAuthToken(auth: Auth, stored: string) {
	const { secretConfig } = await auth.$context

	return await symmetricDecrypt({ key: secretConfig, data: stored })
}
