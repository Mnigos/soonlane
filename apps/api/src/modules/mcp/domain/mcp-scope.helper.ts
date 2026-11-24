import { MCP_SCOPES, type McpScope } from '@soonlane/auth'

/** The scopes with what they imply: edit implies see, so `tasks:write` brings `tasks:read` (ADR 0020). */
function withImplied(scopes: readonly string[]) {
	const granted = new Set(scopes)

	if (granted.has(MCP_SCOPES.write)) granted.add(MCP_SCOPES.read)

	return granted
}

/**
 * The task scopes an agent may use on a request: those both its token and its connection grant. A token keeps the scopes it was issued with,
 * so a connection narrowed on a later Allow narrows the tokens issued before it.
 */
export function effectiveMcpScopes(
	tokenScopes: readonly string[],
	connectionScopes: readonly string[]
): McpScope[] {
	const token = withImplied(tokenScopes)
	const connection = withImplied(connectionScopes)

	return Object.values(MCP_SCOPES).filter(
		scope => token.has(scope) && connection.has(scope)
	)
}
