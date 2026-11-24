import type {
	Account,
	BetterAuthPlugin,
	GenericEndpointContext,
} from 'better-auth'
import {
	decryptOAuthToken,
	getOAuth2Tokens,
	type OAuth2Tokens,
	refreshAccessTokenRequest,
} from 'better-auth/oauth2'
import { z } from 'zod'
import {
	LINEAR_GRAPHQL_URL,
	LINEAR_PROVIDER_ID,
	LINEAR_REVOKE_URL,
	LINEAR_TOKEN_URL,
} from './linear.constants'
import type { OAuthClientOptions, OAuthTokenKind } from './oauth-client.types'
import { type LinkingUser, linkOnlyProvider } from './provider-link.handler'

const LINEAR_TIMEOUT_MS = 10_000

/** The fields Better Auth's Linear profile declares. */
const viewerSchema = z.object({
	data: z.object({
		viewer: z.object({
			id: z.string(),
			name: z.string(),
			email: z.string(),
			active: z.boolean(),
			createdAt: z.string(),
			updatedAt: z.string(),
		}),
	}),
})

/** `null` outside a signed-in user's link; the email is the linking user's own, so Better Auth's same-email check passes for Linear alone. */
async function readLinearUser(
	accessToken: string | undefined,
	link: LinkingUser | undefined
) {
	if (!(accessToken && link)) return null

	try {
		const response = await fetch(LINEAR_GRAPHQL_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${accessToken}`,
			},
			body: JSON.stringify({
				query: '{ viewer { id name email active createdAt updatedAt } }',
			}),
			signal: AbortSignal.timeout(LINEAR_TIMEOUT_MS),
		})
		const parsed = viewerSchema.safeParse(
			response.ok ? await response.json() : undefined
		)

		if (!parsed.success) return null

		const { viewer } = parsed.data.data

		return {
			user: { email: link.email, name: viewer.name, emailVerified: false },
			data: viewer,
		}
	} catch {
		return null
	}
}

const revokeErrorSchema = z.object({ error: z.string() })
/** Answers that mean Linear holds no grant for the token: one it no longer knows, or one revoked before. */
const GONE_ANSWERS: Readonly<Record<number, RegExp>> = {
	401: /token not found/iu,
	400: /revoked/iu,
}
const REASON_MAX_LENGTH = 120

/** Linear's short `error` string from a refusal, which never holds the token. */
function readRevokeError(body: string) {
	try {
		const parsed = revokeErrorSchema.safeParse(JSON.parse(body))

		return parsed.success
			? parsed.data.error.slice(0, REASON_MAX_LENGTH)
			: undefined
	} catch {
		return undefined
	}
}

/**
 * `undefined` once Linear holds no grant for the token (200, or a 401 or 400 that says so); otherwise the status with Linear's reason, or the error's name.
 * Linear reads the token from the form; it ignores client credentials, and only a Bearer header next to the token conflicts.
 */
export async function revokeLinearToken(token: string, kind: OAuthTokenKind) {
	try {
		const response = await fetch(LINEAR_REVOKE_URL, {
			method: 'POST',
			body: new URLSearchParams({ token, token_type_hint: kind }),
			signal: AbortSignal.timeout(LINEAR_TIMEOUT_MS),
		})

		if (response.status === 200) return undefined

		const body = await response.text()

		if (GONE_ANSWERS[response.status]?.test(body)) return undefined

		return [response.status, readRevokeError(body)].filter(Boolean).join(' ')
	} catch (error) {
		return error instanceof Error ? error.name : typeof error
	}
}

const tokenResponseSchema = z.looseObject({ access_token: z.string().min(1) })

/** Better Auth's own Linear refresh with a deadline: the default sends no signal, so a silent token endpoint would hold the API's refresh permit up to Bun's 5-minute idle timeout. */
async function refreshLinearToken(
	client: OAuthClientOptions,
	refreshToken: string
) {
	const { body, headers } = await refreshAccessTokenRequest({
		refreshToken,
		options: client,
		tokenEndpoint: LINEAR_TOKEN_URL,
	})
	const response = await fetch(LINEAR_TOKEN_URL, {
		method: 'POST',
		body,
		headers,
		redirect: 'error',
		signal: AbortSignal.timeout(LINEAR_TIMEOUT_MS),
	})

	if (!response.ok) throw new Error(String(response.status))

	return getOAuth2Tokens(tokenResponseSchema.parse(await response.json()))
}

async function revokeDeletedAccount(
	account: Account,
	context: GenericEndpointContext | null
) {
	if (
		account.providerId !== LINEAR_PROVIDER_ID ||
		context?.path !== '/delete-user'
	)
		return

	const stored = [
		[account.accessToken, 'access_token'],
		[account.refreshToken, 'refresh_token'],
	] as const
	const reasons = await Promise.all(
		stored.map(async ([token, kind]) => {
			if (!token) return undefined

			try {
				return await revokeLinearToken(
					await decryptOAuthToken(token, context.context),
					kind
				)
			} catch (error) {
				return error instanceof Error ? error.name : typeof error
			}
		})
	)
	const failures = reasons.filter(reason => reason !== undefined)

	if (failures.length > 0)
		context.context.logger.warn(
			'Revoking Linear tokens of a deleted account failed',
			...failures
		)
}

/** Linear (Better Auth's `linear` provider, scope `read`) for linking only, and a plugin that revokes an unfinished link's tokens and, best effort, a deleted account's grant before its row goes. */
export function linearLink(client: OAuthClientOptions) {
	const link = linkOnlyProvider(LINEAR_PROVIDER_ID, revokeLinearToken)

	return {
		provider: {
			...client,
			disableSignUp: true,
			disableImplicitSignUp: true,
			refreshAccessToken: async (refreshToken: string) =>
				await refreshLinearToken(client, refreshToken),
			getUserInfo: async (tokens: OAuth2Tokens) =>
				await readLinearUser(tokens.accessToken, await link.takeLink(tokens)),
		},
		plugin: {
			id: 'linear-link',
			hooks: { after: [link.revokeUnstoredTokens] },
			init: () => ({
				options: {
					databaseHooks: {
						account: { delete: { before: revokeDeletedAccount } },
					},
				},
			}),
		} satisfies BetterAuthPlugin,
	}
}
