import { betterFetch } from '@better-fetch/fetch'
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

/** Applied as a signal, not `betterFetch`'s `timeout`, whose timer stops once the headers arrive and leaves the body unbounded. */
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
	if (!accessToken || !link) return null

	try {
		const { data: answer } = await betterFetch(LINEAR_GRAPHQL_URL, {
			method: 'POST',
			headers: { Authorization: `Bearer ${accessToken}` },
			body: {
				query: '{ viewer { id name email active createdAt updatedAt } }',
			},
			output: viewerSchema,
			signal: AbortSignal.timeout(LINEAR_TIMEOUT_MS),
		})

		if (!answer) return null

		const { viewer } = answer.data

		return {
			user: { email: link.email, name: viewer.name, emailVerified: false },
			data: viewer,
		}
	} catch {
		return null
	}
}

/** Linear's refusal body, such as `{ "error": "Token not found" }`; its `error` never holds the token. */
interface LinearRevokeError {
	error?: unknown
}

/** Answers that mean Linear holds no grant for the token: one it no longer knows, or one revoked before. */
const GONE_ANSWERS: Readonly<Record<number, RegExp>> = {
	401: /token not found/iu,
	400: /revoked/iu,
}
const REASON_MAX_LENGTH = 120

/**
 * `undefined` once Linear holds no grant for the token (a success, or a 401 or 400 whose `error` says so); otherwise the status with Linear's reason, or the error's name.
 * Linear reads the token from the form; it ignores client credentials, and only a Bearer header next to the token conflicts.
 */
export async function revokeLinearToken(token: string, kind: OAuthTokenKind) {
	try {
		const { error } = await betterFetch<unknown, LinearRevokeError>(
			LINEAR_REVOKE_URL,
			{
				method: 'POST',
				body: new URLSearchParams({ token, token_type_hint: kind }),
				signal: AbortSignal.timeout(LINEAR_TIMEOUT_MS),
			}
		)

		if (!error) return undefined

		const reason = typeof error.error === 'string' ? error.error : ''

		if (GONE_ANSWERS[error.status]?.test(reason)) return undefined

		return [error.status, reason.slice(0, REASON_MAX_LENGTH)]
			.filter(Boolean)
			.join(' ')
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
	const { data, error } = await betterFetch(LINEAR_TOKEN_URL, {
		method: 'POST',
		body,
		headers,
		redirect: 'error',
		output: tokenResponseSchema,
		signal: AbortSignal.timeout(LINEAR_TIMEOUT_MS),
	})

	if (error) throw new Error(String(error.status))

	return getOAuth2Tokens(data)
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

	const authContext = context.context
	const stored = [
		[account.accessToken, 'access_token'],
		[account.refreshToken, 'refresh_token'],
	] as const
	const reasons = await Promise.all(
		stored.map(async ([token, kind]) => {
			if (!token) return undefined

			try {
				const plain = await decryptOAuthToken(token, authContext)

				return await revokeLinearToken(plain, kind)
			} catch (error) {
				return error instanceof Error ? error.name : typeof error
			}
		})
	)
	const failures = reasons.filter(reason => reason !== undefined)

	if (failures.length > 0)
		authContext.logger.warn(
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
