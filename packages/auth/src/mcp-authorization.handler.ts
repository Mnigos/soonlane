import { cimd } from '@better-auth/cimd'
import { fetchClientMetadataResource } from '@better-auth/cimd/node'
import { mcp } from '@better-auth/mcp'
import {
	jwks,
	oauthAccessToken,
	oauthClient,
	oauthClientAssertion,
	oauthClientResource,
	oauthConsent,
	oauthRefreshToken,
	oauthResource,
} from '@soonlane/db'
import type { BetterAuthPlugin } from 'better-auth'
import {
	APIError,
	createAuthMiddleware,
	getSessionFromCtx,
} from 'better-auth/api'
import { jwt } from 'better-auth/plugins'
import { isBearerRequest } from './account-deletion.handler'
import {
	MCP_ACCOUNT_CHANGED,
	MCP_ALLOW_PATH,
	MCP_ANSWER_USER_FIELD,
	MCP_CONNECTION_IDLE_DAYS,
	MCP_SCOPES,
	MCP_PATH,
	OFFLINE_ACCESS_SCOPE,
} from './mcp-authorization.constants'

export interface McpAuthorizationOptions {
	/** The API's origin: the issuer, and with `MCP_PATH` the resource. */
	baseUrl: string
	/** The web app's origin, which serves the login and Allow pages. */
	appUrl: string
	/** Opens `/oauth2/register` to anyone, behind `registrationGuard`; while off, the endpoint answers 403 as the plugin does. */
	dynamicRegistration: boolean
}

/** The tables the plugins below read and write, keyed by their model names, for the Drizzle adapter. */
export const MCP_AUTHORIZATION_SCHEMA = {
	jwks,
	oauthAccessToken,
	oauthClient,
	oauthClientAssertion,
	oauthClientResource,
	oauthConsent,
	oauthRefreshToken,
	oauthResource,
}

/**
 * The OAuth provider's endpoints Soonlane does not use: session-backed client and consent management (the API's `mcp` module lists and ends connections, deleting the tokens too),
 * introspection, OpenID logout and userinfo, and the `jwt` plugin's session token.
 */
export const UNUSED_MCP_AUTHORIZATION_PATHS = [
	'/oauth2/create-client',
	'/oauth2/get-client',
	'/oauth2/get-clients',
	'/oauth2/update-client',
	'/oauth2/client/rotate-secret',
	'/oauth2/client/rotate-keys',
	'/oauth2/delete-client',
	'/oauth2/get-consent',
	'/oauth2/get-consents',
	'/oauth2/update-consent',
	'/oauth2/delete-consent',
	'/oauth2/introspect',
	'/oauth2/end-session',
	'/oauth2/end-session/confirm',
	'/oauth2/userinfo',
	'/oauth2/public-client-prelogin',
	'/token',
]

const SCOPES = [MCP_SCOPES.read, MCP_SCOPES.write, OFFLINE_ACCESS_SCOPE]
const SECONDS_PER_DAY = 86_400
const CLIENT_NAME_MAX_LENGTH = 80
/** Metadata that would make the API fetch or post to an address the registrant chose, or vouch for itself. */
const UNREGISTRABLE_FIELDS = [
	'jwks',
	'jwks_uri',
	'backchannel_logout_uri',
	'backchannel_logout_session_required',
	'post_logout_redirect_uris',
	'software_statement',
]
const PRINTABLE_NAME = /^[^\p{C}]+$/u

function invalidMetadata(description: string) {
	return new APIError('BAD_REQUEST', {
		error: 'invalid_client_metadata',
		error_description: description,
	})
}

/** What an agent registering itself may declare: no address the API would fetch or post to, and a short printable name for the Allow page. */
function registrationGuard() {
	return {
		id: 'mcp-registration-guard',
		hooks: {
			before: [
				{
					matcher: ({ path }) => path === '/oauth2/register',
					handler: createAuthMiddleware(async ctx => {
						const body: unknown = ctx.body

						if (typeof body !== 'object' || body === null) return

						const name = 'client_name' in body ? body.client_name : undefined

						if (UNREGISTRABLE_FIELDS.some(field => field in body))
							throw invalidMetadata('These client metadata fields are refused.')
						if (
							typeof name === 'string' &&
							!(
								name.length <= CLIENT_NAME_MAX_LENGTH &&
								PRINTABLE_NAME.test(name)
							)
						)
							throw invalidMetadata(
								`client_name must be at most ${CLIENT_NAME_MAX_LENGTH} printable characters.`
							)
					}),
				},
			],
		},
	} satisfies BetterAuthPlugin
}

/**
 * Refuses an Allow page answer unless it names the account of the session it is posted with, before the provider stores a consent:
 * a page left open while another tab signed in to another account would otherwise grant that account's tasks under the first one's name.
 */
function consentAccountGuard() {
	return {
		id: 'mcp-consent-account-guard',
		hooks: {
			before: [
				{
					matcher: ({ path }) => path === '/oauth2/consent',
					handler: createAuthMiddleware(async ctx => {
						// A before hook never sees a bearer session, and the Allow page answers only from the browser.
						if (isBearerRequest(ctx))
							throw new APIError('FORBIDDEN', {
								message: 'Answer an agent from the browser.',
							})

						const body: unknown = ctx.body
						const userId =
							typeof body === 'object' &&
							body !== null &&
							MCP_ANSWER_USER_FIELD in body
								? body[MCP_ANSWER_USER_FIELD]
								: undefined

						if (typeof userId !== 'string')
							throw new APIError('BAD_REQUEST', {
								message: `Send the ${MCP_ANSWER_USER_FIELD} the page showed.`,
							})

						const session = await getSessionFromCtx(ctx)

						// Without a session the endpoint itself answers 401.
						if (session && session.user.id !== userId)
							throw new APIError('CONFLICT', {
								code: MCP_ACCOUNT_CHANGED,
								message: 'The page showed another account than this session.',
							})
					}),
				},
			],
		},
	} satisfies BetterAuthPlugin
}

/**
 * The authorization server agents sign in through: Better Auth's MCP plugin, issuing JWT access tokens for `<baseUrl>/mcp`, with clients identified by their
 * Client ID Metadata Document, fetched over a connection pinned to the address it resolved to. Its discovery documents answer at the host root.
 */
export function mcpAuthorization({
	baseUrl,
	appUrl,
	dynamicRegistration,
}: McpAuthorizationOptions) {
	const resource = `${baseUrl}${MCP_PATH}`

	return [
		// The issuer is the origin, so agents that read only the root's metadata find it.
		jwt({ jwt: { issuer: baseUrl }, disableSettingJwtHeader: true }),
		mcp({
			resource,
			resources: [
				{ identifier: resource, name: 'Soonlane', allowedScopes: SCOPES },
			],
			resourceSeedMode: 'overwrite',
			scopes: SCOPES,
			grantTypes: ['authorization_code', 'refresh_token'],
			loginPage: `${appUrl}/login`,
			consentPage: `${appUrl}${MCP_ALLOW_PATH}`,
			refreshTokenExpiresIn: MCP_CONNECTION_IDLE_DAYS * SECONDS_PER_DAY,
			// A signed-in user could otherwise register a client that phishes other users.
			clientPrivileges: () => false,
			allowDynamicClientRegistration: dynamicRegistration,
			allowUnauthenticatedClientRegistration: dynamicRegistration,
			clientRegistrationDefaultApplicationType: 'infer',
			rateLimit: {
				token: { window: 60, max: 60 },
				register: { window: 3600, max: 10 },
			},
		}),
		cimd({ fetchClientMetadataResource, metadataProfile: 'mcp-2026-07-28' }),
		consentAccountGuard(),
		...(dynamicRegistration ? [registrationGuard()] : []),
	]
}
