import type {
	Account,
	AuthContext,
	GenericEndpointContext,
	HookEndpointContext,
} from 'better-auth'
import {
	APIError,
	createAuthMiddleware,
	getOAuthState,
	getSessionFromCtx,
} from 'better-auth/api'
import { decryptOAuthToken, type OAuth2Tokens } from 'better-auth/oauth2'
import { isBearerRequest } from './account-deletion.handler'
import type { OAuthTokenKind } from './oauth-client.types'

export interface LinkingUser {
	email: string
}

/** The configured providers a signed-in user can only link, never sign in with, each with the code `/link-social` refuses with while the user has a row of it. */
export type LinkOnlyProviders = Readonly<Record<string, string>>

/** What the web app sends; anything more could widen the scope or the authorize URL. */
const LINK_BODY_KEYS = new Set(['provider', 'callbackURL', 'errorCallbackURL'])

export function refuseProvider(message: string) {
	return new APIError('FORBIDDEN', { code: 'PROVIDER_NOT_ALLOWED', message })
}

export function isLinkOnly(
	provider: unknown,
	providers: LinkOnlyProviders
): provider is string {
	return typeof provider === 'string' && Object.hasOwn(providers, provider)
}

export async function refuseUnsafeLink(
	ctx: GenericEndpointContext,
	provider: unknown,
	providers: LinkOnlyProviders
) {
	const body: unknown = ctx.body

	if (isBearerRequest(ctx))
		throw refuseProvider('Accounts can only be linked from the browser.')
	if (!isLinkOnly(provider, providers))
		throw refuseProvider('This provider cannot be linked.')
	if (
		typeof body === 'object' &&
		body !== null &&
		Object.keys(body).some(key => !LINK_BODY_KEYS.has(key))
	)
		throw refuseProvider('A link takes no other parameters.')

	const { internalAdapter } = ctx.context
	const signedIn = await getSessionFromCtx(ctx)
	const linked = signedIn
		? await internalAdapter.findAccounts(signedIn.user.id)
		: []

	// A new link must not overwrite a row whose tokens are not revoked yet; the API closes the earlier connection first.
	if (linked.some(({ providerId }) => providerId === provider))
		throw new APIError('CONFLICT', {
			code: providers[provider],
			message: 'The earlier connection is still open.',
		})
}

/** A link callback writing a row of a link-only provider. */
function isLinkOnlyCallback(
	context: GenericEndpointContext | null,
	providerId: unknown,
	providers: LinkOnlyProviders
) {
	return context?.path === '/callback/:id' && isLinkOnly(providerId, providers)
}

/**
 * Backs `/link-social`'s check against two links racing, from one session or two: a callback neither overwrites a link-only row nor adds a second one for the same owner, so the later link's tokens stay unstored and its after hook revokes them.
 * The API's Linear refreshes still update the row.
 */
export function linkOnlyAccountHooks(providers: LinkOnlyProviders) {
	return {
		create: {
			before: async (
				created: Account,
				context: GenericEndpointContext | null
			) => {
				if (
					!context ||
					!isLinkOnlyCallback(context, created.providerId, providers)
				)
					return true

				const { internalAdapter } = context.context

				// Fails closed: a refused create ends the callback with an error, and its after hook revokes the tokens.
				try {
					const accounts = await internalAdapter.findAccounts(created.userId)

					return !accounts.some(
						({ providerId }) => providerId === created.providerId
					)
				} catch {
					return false
				}
			},
		},
		update: {
			before: async (
				{ providerId }: Partial<Account>,
				context: GenericEndpointContext | null
			) => !isLinkOnlyCallback(context, providerId, providers),
		},
	}
}

/** Unknown counts as not stored, so a failed lookup revokes rather than leaves a live grant behind. */
async function isStored(
	context: AuthContext,
	providerId: string,
	userId: string,
	accessToken: string
) {
	try {
		const accounts = await context.internalAdapter.findAccounts(userId)
		const stored = await Promise.all(
			accounts
				.filter(account => account.providerId === providerId)
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
 * What every link-only provider shares (ADR 0016): `takeLink` keeps a callback's tokens and returns its link, `undefined` outside a signed-in user's link, where user info must be `null`;
 * `revokeUnstoredTokens`, the callback's after hook, revokes at once the tokens no row ended up holding, since nothing durable is left to retry from. `revoke` answers `undefined` once no grant is left.
 */
export function linkOnlyProvider(
	providerId: string,
	revoke: (token: string, kind: OAuthTokenKind) => Promise<string | undefined>
) {
	const issuedTokens = new WeakMap<object, OAuth2Tokens>()

	return {
		takeLink: async (tokens: OAuth2Tokens) => {
			const state = await getOAuthState()

			if (state) issuedTokens.set(state, tokens)

			return state?.link
		},
		revokeUnstoredTokens: {
			matcher: (ctx: HookEndpointContext) => ctx.path === '/callback/:id',
			handler: createAuthMiddleware(async ({ context }) => {
				const state = await getOAuthState()
				const issued = state ? issuedTokens.get(state) : undefined

				if (!state || !issued?.accessToken) return

				issuedTokens.delete(state)

				const stored = state.link
					? await isStored(
							context,
							providerId,
							state.link.userId,
							issued.accessToken
						)
					: false

				if (stored) return

				const failures = await Promise.all([
					revoke(issued.accessToken, 'access_token'),
					...(issued.refreshToken
						? [revoke(issued.refreshToken, 'refresh_token')]
						: []),
				])
				const reasons = failures.filter(reason => reason !== undefined)

				if (reasons.length > 0)
					context.logger.warn(
						`Revoking ${providerId} tokens of an unfinished link failed`,
						...reasons
					)
			}),
		},
	}
}
