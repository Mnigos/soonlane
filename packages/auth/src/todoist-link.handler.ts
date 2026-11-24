import { genericOAuth } from 'better-auth/plugins/generic-oauth'
import { z } from 'zod'
import type { OAuthClientOptions } from './oauth-client.types'
import { type LinkingUser, linkOnlyProvider } from './provider-link.handler'
import {
	TODOIST_PROVIDER_ID,
	TODOIST_REVOKE_URL,
	TODOIST_SYNC_URL,
} from './todoist.constants'

const TODOIST_TIMEOUT_MS = 10_000

const syncUserSchema = z.object({
	user: z.object({ id: z.string(), full_name: z.string() }),
})

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

/** Todoist as a read-only provider that a signed-in user can only link, never sign in or sign up with. */
export function todoistLink(client: OAuthClientOptions) {
	const link = linkOnlyProvider(
		TODOIST_PROVIDER_ID,
		async token => await revoke(client, token)
	)
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
				getUserInfo: async tokens =>
					await readTodoistUser(
						tokens.accessToken,
						await link.takeLink(tokens)
					),
			},
		],
	})

	return {
		...plugin,
		hooks: { ...plugin.hooks, after: [link.revokeUnstoredTokens] },
	}
}
