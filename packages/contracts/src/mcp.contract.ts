import { oc } from '@orpc/contract'
import { mcpConnectionIdSchema } from '@soonlane/domain'
import { z } from 'zod'
import { authErrors } from './auth.errors'

/**
 * One agent's access to the user's tasks. `host` is the web address the agent proved it owns, absent for one registered without proof;
 * `lastUsedAt` is its latest token refresh, absent while it has none.
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
	listConnections: oc
		.errors(authErrors)
		.output(z.object({ connections: z.array(mcpConnectionSchema) })),
	/** Ends the connection and deletes its tokens, so the agent loses access at once. */
	disconnect: oc
		.errors({ ...authErrors, NOT_FOUND: mcpConnectionNotFound })
		.input(mcpConnectionIdInputSchema)
		.output(z.void()),
}
