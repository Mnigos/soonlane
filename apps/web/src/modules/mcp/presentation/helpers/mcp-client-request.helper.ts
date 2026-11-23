import {
	MCP_SCOPES,
	AUTH_BASE_PATH,
	OFFLINE_ACCESS_SCOPE,
} from '@soonlane/auth'
import { createIsomorphicFn } from '@tanstack/react-start'

/** The task access an agent can be allowed, in the Allow page's `access` search param: edit implies see, and it can only narrow what the agent asked for. */
export type McpAccess = keyof typeof MCP_SCOPES

/** What the Allow page reads from the signed request, every value the string the provider signed. */
export interface McpClientRequest {
	clientId?: string
	requestedScope?: string
	redirectUri?: string
	/** When the signature expires, in milliseconds; 0 when the request names none. */
	expiresAt: number
	/** The signed params as `oauth_query`, which the answer must carry. */
	signedRequest: string
	signInAgainUrl: string
}

/** Better Auth's own parameters on the signed request: the signed names, the signature, when it expires and when it was signed. */
const SIGNED_NAMES_PARAM = 'ba_param'
const SIGNATURE_PARAM = 'sig'
const PROVIDER_PARAMS = [
	SIGNED_NAMES_PARAM,
	SIGNATURE_PARAM,
	'exp',
	'ba_iat',
	'ba_pl',
]
const ACCESS_ORDER: McpAccess[] = ['read', 'write']
const MS_PER_SECOND = 1000

/**
 * Reads the provider's query, which the Allow page carries verbatim as one string; `URLSearchParams` keeps every value as signed.
 * Only what Better Auth signed is read and sent, as its browser client does, so a param another party added is neither shown nor fails the signature.
 */
export function readMcpClientRequest(query: string): McpClientRequest {
	const params = new URLSearchParams(query)
	const signedNames = new Set(params.getAll(SIGNED_NAMES_PARAM))
	const signed = new URLSearchParams(
		[...params].filter(
			([name]) =>
				signedNames.has(name) ||
				name === SIGNED_NAMES_PARAM ||
				name === SIGNATURE_PARAM
		)
	)
	const authorize = new URLSearchParams(signed)

	for (const name of PROVIDER_PARAMS) authorize.delete(name)
	authorize.set('prompt', 'login')

	return {
		clientId: signed.get('client_id') ?? undefined,
		requestedScope: signed.get('scope') ?? undefined,
		redirectUri: signed.get('redirect_uri') ?? undefined,
		expiresAt: Number(signed.get('exp')) * MS_PER_SECOND || 0,
		signedRequest: signed.toString(),
		signInAgainUrl: `${import.meta.env.VITE_API_URL ?? ''}${AUTH_BASE_PATH}/oauth2/authorize?${authorize}`,
	}
}

/**
 * Whether a signed request expired, by the server's clock, which signed it; always false in the browser, where only the provider's
 * `invalid_signature` answer expires a page, so a device clock running fast cannot hide the Allow or login page.
 */
export const hasExpiredOnServer = createIsomorphicFn()
	.server((expiresAt: number) => expiresAt <= Date.now())
	.client(() => false)

/** The access the agent asked for and what is ticked: all of it until the `access` param narrows it. A value the agent did not ask for is ignored, then edit brings see. */
export function readAccessChoice(
	requestedScope: string | undefined,
	access: McpAccess[] | undefined
) {
	const scopes = requestedScope?.split(' ') ?? []
	const requested = ACCESS_ORDER.filter(item =>
		scopes.includes(MCP_SCOPES[item])
	)
	const narrowed = access?.filter(item => requested.includes(item))
	const chosen = narrowed?.includes('write') ? ACCESS_ORDER : narrowed

	return {
		requested,
		ticked: chosen
			? requested.filter(item => chosen.includes(item))
			: requested,
		keepsRefresh: scopes.includes(OFFLINE_ACCESS_SCOPE),
	}
}

/** Ticking edit ticks see, and unticking see unticks edit. */
export function toggleAccess(ticked: McpAccess[], item: McpAccess) {
	if (ticked.includes(item))
		return item === 'read' ? [] : ticked.filter(other => other !== item)

	return item === 'write' ? ACCESS_ORDER : [...ticked, item]
}

/** The scope Allow posts: the ticked access, with `offline_access` when the agent asked for it. */
export function toScope(ticked: McpAccess[], keepsRefresh: boolean) {
	const scopes: string[] = ticked.map(item => MCP_SCOPES[item])

	if (keepsRefresh) scopes.push(OFFLINE_ACCESS_SCOPE)

	return scopes.join(' ')
}
