/** What an agent may ask for: `read` covers tasks, projects and labels, `write` adds creating and changing them; nothing deletes. */
export const MCP_SCOPES = {
	read: 'tasks:read',
	write: 'tasks:write',
} as const
export type McpScope = (typeof MCP_SCOPES)[keyof typeof MCP_SCOPES]
/** Grants the refresh token; the Allow page never shows it and always keeps it when asked for. */
export const OFFLINE_ACCESS_SCOPE = 'offline_access'
/** The web page where the user allows an agent; a web-only path outside `@soonlane/app`'s `APP_PATHS` (ADR 0015). */
export const MCP_ALLOW_PATH = '/mcp/allow'
/** The body field of an Allow page answer that names the account the page showed. */
export const MCP_ANSWER_USER_FIELD = 'user_id'
/** The error code of an Allow page answer from a page that showed another account than the session's. */
export const MCP_ACCOUNT_CHANGED = 'MCP_ACCOUNT_CHANGED'
/** The MCP server on the API; with the API's origin it is the protected resource agents' tokens are issued for. */
export const MCP_PATH = '/mcp'
/** How long an MCP connection lives without use: its refresh token's lifetime, after which the API's sweep removes it. */
export const MCP_CONNECTION_IDLE_DAYS = 30

/** The host-root discovery documents agents read; the API routes them to Better Auth, whose MCP plugin answers them. */
export const MCP_DISCOVERY_PATHS = [
	'/.well-known/oauth-authorization-server',
	'/.well-known/oauth-protected-resource',
	`/.well-known/oauth-protected-resource${MCP_PATH}`,
]
