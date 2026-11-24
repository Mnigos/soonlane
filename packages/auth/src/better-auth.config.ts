import { account, rateLimit, session, user, verification } from '@soonlane/db'
import { ACCESS_ERROR_MESSAGES } from '@soonlane/domain'
import { type BetterAuthPlugin, betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { APIError, createAuthMiddleware, isAPIError } from 'better-auth/api'
import { symmetricDecrypt } from 'better-auth/crypto'
import { bearer } from 'better-auth/plugins'
import {
	GOOGLE_AUTH_TIME_CLAIMS,
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
import { linearLink } from './linear-link.handler'
import { LINEAR_PROVIDER_ID, LINEAR_STILL_CONNECTED } from './linear.constants'
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
import {
	isLinkOnly,
	linkOnlyAccountHooks,
	refuseProvider,
	refuseUnsafeLink,
} from './provider-link.handler'
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
export {
	type McpRequestServer,
	type McpToken,
	serveMcpRequest,
} from './mcp-request.handler'
export type { SignInCodeMail } from './email-code.handler'
export { revokeLinearToken } from './linear-link.handler'
export { refreshStoredOAuthToken } from './oauth-token.helper'

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

/**
 * Better Auth for anyone with a verified Google address or a mailbox that
 * receives a sign-in code; either method may be off, not both. `allowedEmails`, when
 * set, limits who can create an account; existing accounts keep signing in.
 * Also uuid ids, account deletion, rate limits kept in the database, the
 * signed-in hint cookie, the hand-off of a browser sign-in to the desktop
 * app with the signed bearer token its session uses, and to the Android
 * app through a verified App Link, the iPhone app's sign-in through Better
 * Auth's Expo plugin and, when configured,
 * linking Todoist for an import and Linear for as long as the user keeps it:
 * both are only linked, Google only signs in, and provider tokens are
 * stored encrypted.
 */
export function createAuth(options: CreateAuthOptions) {
	const linear = options.linear && linearLink(options.linear)
	const linkOnlyProviders = {
		...(options.todoist && { [TODOIST_PROVIDER_ID]: TODOIST_STILL_CONNECTED }),
		...(linear && { [LINEAR_PROVIDER_ID]: LINEAR_STILL_CONNECTED }),
	}
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
		socialProviders: {
			...(options.google && {
				google: { ...options.google, disableIdTokenSignIn: true },
			}),
			...(linear && { linear: linear.provider }),
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
		// Todoist and Linear report no verified email; their user info carries the linking user's own address.
		account: {
			encryptOAuthTokens: true,
			accountLinking: {
				trustedProviders: [TODOIST_PROVIDER_ID, LINEAR_PROVIDER_ID],
			},
		},
		hooks: {
			before: createAuthMiddleware(async ctx => {
				const provider = readProvider(ctx.body)

				if (
					ctx.path === '/sign-in/social' &&
					isLinkOnly(provider, linkOnlyProviders)
				)
					throw refuseProvider(
						'This provider can only be linked to a signed-in account.'
					)
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
					throw refuseProvider(
						'Only a Google sign-in opens from the mobile app.'
					)
				if (ctx.path === '/link-social')
					await refuseUnsafeLink(ctx, provider, linkOnlyProviders)
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
			account: linkOnlyAccountHooks(linkOnlyProviders),
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
			...(linear ? [linear.plugin] : []),
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
