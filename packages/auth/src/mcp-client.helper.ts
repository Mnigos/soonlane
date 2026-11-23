import { MCP_ACCOUNT_CHANGED } from './mcp-authorization.constants'

/**
 * The host an agent proved it owns, or `undefined` for one it did not.
 * An HTTPS client id is a Client ID Metadata Document URL that Better Auth fetched from that host; any other id was registered without proof.
 */
export function readVerifiedMcpClientHost(clientId: string) {
	const url = URL.parse(clientId)

	return url?.protocol === 'https:' ? url.host : undefined
}

/** Whether Better Auth refused an agent's signed request, as its OAuth provider does once the signature expired. */
export function isRefusedMcpClientRequest(error: unknown) {
	return (
		typeof error === 'object' &&
		error !== null &&
		'error' in error &&
		error.error === 'invalid_signature'
	)
}

/** Whether the API refused an Allow page answer because the session now holds another account than the page showed. */
export function isAccountChangedAnswer(error: unknown) {
	return (
		typeof error === 'object' &&
		error !== null &&
		'code' in error &&
		error.code === MCP_ACCOUNT_CHANGED
	)
}
