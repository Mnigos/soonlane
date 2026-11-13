import type { AuthContext, HookEndpointContext } from 'better-auth'
import { createAuthMiddleware, getOAuthState } from 'better-auth/api'
import { decryptOAuthToken, type OAuth2Tokens } from 'better-auth/oauth2'
import { genericOAuth } from 'better-auth/plugins/generic-oauth'
import { z } from 'zod'
import type { OAuthClientOptions } from './oauth-client.types'
import {
	TODOIST_PROVIDER_ID,
	TODOIST_REVOKE_URL,
	TODOIST_SYNC_URL,
} from './todoist.constants'

/** The signed-in user who started linking Todoist. */
interface LinkingUser {
	email: string
}

const TODOIST_TIMEOUT_MS = 10_000

const syncUserSchema = z.object({
	user: z.object({ id: z.string(), full_name: z.string() }),
})

/** The tokens a callback received, keyed by its parsed OAuth state (one object per request), until its after hook sees whether a row holds them. */
const issuedTokens = new WeakMap<object, OAuth2Tokens>()

/**
 * `null` outside a signed-in user's link fails the callback before Better Auth touches a user, account or session, so a replayed sign-in state signs no one in.
 * The email is the linking user's own, so Better Auth's same-email check passes for Todoist alone; Todoist's own address is not used.
 */
async function readTodoistUser(
	accessToken: string | undefined,
	link: LinkingUser | undefined
) {
	if (!(accessToken && link)) return null

	try {
		const response = await fetch(TODOIST_SYNC_URL, {
			method: 'POST',
			headers: { Authorization: `Bearer ${accessToken}` },
			body: new URLSearchParams({
				sync_token: '*',
				resource_types: '["user"]',
			}),
			signal: AbortSignal.timeout(TODOIST_TIMEOUT_MS),
		})
		const parsed = syncUserSchema.safeParse(
			response.ok ? await response.json() : undefined
		)

		if (!parsed.success) return null

		const { id, full_name: name } = parsed.data.user

		return { id, email: link.email, name, emailVerified: false }
	} catch {
		return null
	}
}

/** `undefined` once Todoist confirmed the revocation, otherwise its HTTP status or the error's name. */
async function revoke(client: OAuthClientOptions, token: string) {
	try {
		const response = await fetch(TODOIST_REVOKE_URL, {
			method: 'POST',
			headers: {
				Authorization: `Basic ${btoa(`${client.clientId}:${client.clientSecret}`)}`,
			},
			body: new URLSearchParams({ token }),
			signal: AbortSignal.timeout(TODOIST_TIMEOUT_MS),
		})

		return response.ok ? undefined : String(response.status)
	} catch (error) {
		return error instanceof Error ? error.name : typeof error
	}
}

/** Unknown counts as not stored, so a failed lookup revokes rather than leaves a live grant behind. */
async function isStored(
	context: AuthContext,
	userId: string,
	accessToken: string
) {
	try {
		const accounts = await context.internalAdapter.findAccounts(userId)
		const stored = await Promise.all(
			accounts
				.filter(account => account.providerId === TODOIST_PROVIDER_ID)
				.map(async account =>
					account.accessToken
						? await decryptOAuthToken(account.accessToken, context)
						: undefined
				)
		)

		return stored.includes(accessToken)
	} catch {
		return false
	}
}

/**
 * Todoist as a read-only provider that a signed-in user can only link, never sign in or sign up with.
 * Tokens from a callback that ends without a row holding them (no user info, a session gone, an account linked elsewhere) are revoked at once, best effort: nothing durable is left to retry from.
 */
export function todoistLink(client: OAuthClientOptions) {
	const plugin = genericOAuth({
		config: [
			{
				...client,
				providerId: TODOIST_PROVIDER_ID,
				name: 'Todoist',
				authorizationUrl: 'https://app.todoist.com/oauth/authorize',
				tokenUrl: 'https://api.todoist.com/oauth/access_token',
				scopes: ['data:read'],
				disableSignUp: true,
				disableImplicitSignUp: true,
				getUserInfo: async tokens => {
					const state = await getOAuthState()

					if (state) issuedTokens.set(state, tokens)

					return await readTodoistUser(tokens.accessToken, state?.link)
				},
			},
		],
	})
	const revokeUnstoredTokens = createAuthMiddleware(async ctx => {
		const state = await getOAuthState()
		const issued = state ? issuedTokens.get(state) : undefined

		if (!(state && issued?.accessToken)) return

		issuedTokens.delete(state)

		if (
			state.link &&
			(await isStored(ctx.context, state.link.userId, issued.accessToken))
		)
			return

		const failures = await Promise.all(
			[issued.accessToken, issued.refreshToken]
				.filter(token => token !== undefined)
				.map(async token => await revoke(client, token))
		)
		const reasons = failures.filter(reason => reason !== undefined)

		if (reasons.length > 0)
			ctx.context.logger.warn(
				'Revoking Todoist tokens of an unfinished link failed',
				...reasons
			)
	})

	return {
		...plugin,
		hooks: {
			...plugin.hooks,
			after: [
				{
					matcher: (ctx: HookEndpointContext) => ctx.path === '/callback/:id',
					handler: revokeUnstoredTokens,
				},
			],
		},
	}
}
