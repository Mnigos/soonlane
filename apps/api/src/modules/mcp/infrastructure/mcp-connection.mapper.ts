import { MCP_SCOPES, readVerifiedMcpClientHost } from '@soonlane/auth'
import type { McpConnection } from '@soonlane/contracts'
import {
	MCP_CLIENT_NAME_FALLBACK,
	type McpConnectionId,
} from '@soonlane/domain'

/** An `oauth_consent` row joined with its client's name. */
export interface McpConnectionRow {
	id: McpConnectionId
	clientId: string
	name: string | null
	scopes: string[]
	connectedAt: Date | null
	lastUsedAt: Date | null
}

export function toMcpConnection(row: McpConnectionRow): McpConnection {
	const host = readVerifiedMcpClientHost(row.clientId)

	return {
		id: row.id,
		name: row.name ?? host ?? MCP_CLIENT_NAME_FALLBACK,
		host,
		access: row.scopes.includes(MCP_SCOPES.write) ? 'read-write' : 'read',
		connectedAt: row.connectedAt ?? undefined,
		lastUsedAt: row.lastUsedAt ?? undefined,
	}
}
