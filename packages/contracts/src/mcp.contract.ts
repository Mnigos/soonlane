import { oc } from '@orpc/contract'
import { mcpConnectionIdSchema } from '@soonlane/domain'
import { z } from 'zod'
import { authErrors } from './auth.errors'

/**
 * One agent's access to the user's tasks. `host` is the web address the agent proved it owns, absent for one registered without proof;
 * `lastUsedAt` is its latest call to the MCP server, to the minute, absent while it has made none.
 */
export const mcpConnectionSchema = z.object({
	id: mcpConnectionIdSchema,
	name: z.string(),
	host: z.string().optional(),
	access: z.enum(['read', 'read-write']),
	connectedAt: z.date().optional(),
	lastUsedAt: z.date().optional(),
})
export type McpConnection = z.infer<typeof mcpConnectionSchema>

export const mcpConnectionIdInputSchema = z.object({
	id: mcpConnectionIdSchema,
})

export const mcpConnectionNotFound = {
	message: 'This agent is no longer connected.',
}

export const mcpContract = {
	/** `serverUrl` is the MCP server's address, which the user gives an AI app to connect it. */
	listConnections: oc.errors(authErrors).output(
		z.object({
			connections: z.array(mcpConnectionSchema),
			serverUrl: z.url(),
		})
	),
	/** Ends the connection and deletes its tokens, so the agent loses access at once. */
	disconnect: oc
		.errors({ ...authErrors, NOT_FOUND: mcpConnectionNotFound })
		.input(mcpConnectionIdInputSchema)
		.output(z.void()),
}
