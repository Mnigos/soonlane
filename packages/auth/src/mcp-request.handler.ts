import { requireMcpAuth } from '@better-auth/mcp'
import { createResourceServerChallenge } from '@better-auth/oauth-provider'
import { APIError } from 'better-auth/api'
import type { Auth } from './better-auth.config'
import { MCP_SCOPES, MCP_PATH } from './mcp-authorization.constants'

/** What a verified MCP access token says: whose tasks, which client, the scopes it carries and when it was issued. */
export interface McpToken {
	/** `sub`: the user who allowed the agent. */
	userId: string
	/** `azp`: the agent's client id. */
	clientId: string
	scopes: string[]
	/** `iat`, which the provider writes in whole seconds. */
	issuedAt: Date
}

/** Serves a request with a verified token, or answers `undefined` when the token no longer stands for a connection. */
export type McpRequestServer = (
	token: McpToken
) => Promise<Response | undefined>

export interface ServeMcpRequestOptions {
	/** The API's origin: the issuer, and with `MCP_PATH` the resource. */
	baseUrl: string
	request: Request
	serve: McpRequestServer
}

/**
 * The scopes a 401 names: only the task scopes, since the 2026-07-28 spec keeps `offline_access` out of resource challenges;
 * clients add it themselves because the authorization server metadata lists it.
 */
const CHALLENGE_SCOPES = [MCP_SCOPES.read, MCP_SCOPES.write]
const MS_PER_SECOND = 1000

function readMcpToken({
	sub,
	azp,
	scope,
	iat,
}: Record<string, unknown>): McpToken | undefined {
	if (
		typeof sub !== 'string' ||
		typeof azp !== 'string' ||
		typeof iat !== 'number'
	)
		return undefined

	return {
		userId: sub,
		clientId: azp,
		scopes: typeof scope === 'string' ? scope.split(' ') : [],
		issuedAt: new Date(iat * MS_PER_SECOND),
	}
}

/** The plugin's own answer to an invalid token, for a valid token whose connection is gone: a JSON-RPC 401 with the `resource_metadata` challenge. */
function invalidTokenResponse(resource: string, request: Request) {
	const description = 'The agent is not connected.'
	const error = new APIError('UNAUTHORIZED', {
		message: description,
		error: 'invalid_token',
		error_description: description,
	})
	const challenge = createResourceServerChallenge(error, resource, {
		challengeScopes: CHALLENGE_SCOPES,
		request,
	})

	if (!challenge) throw error

	return Response.json(
		{
			jsonrpc: '2.0',
			error: { code: -32_000, message: challenge.message },
			id: null,
		},
		{ status: challenge.statusCode, headers: challenge.headers }
	)
}

/**
 * Verifies an MCP request's access token with Better Auth's MCP plugin (signature, issuer, audience `<baseUrl>/mcp`, expiry, `azp`) and serves it.
 * A missing or invalid token, and one `serve` no longer accepts, get the same 401 challenge, which names the resource metadata and the task scopes.
 */
export async function serveMcpRequest(
	auth: Auth,
	{ baseUrl, request, serve }: ServeMcpRequestOptions
) {
	const resource = `${baseUrl}${MCP_PATH}`

	return await requireMcpAuth(
		auth,
		async (verified, claims) => {
			const token = readMcpToken(claims)
			const response = token && (await serve(token))

			return response ?? invalidTokenResponse(resource, verified)
		},
		{ issuer: baseUrl, resource, challengeScopes: CHALLENGE_SCOPES }
	)(request)
}
