import { z } from 'zod'

export const mcpConnectionIdSchema = z.uuid().brand<'McpConnectionId'>()
export type McpConnectionId = z.infer<typeof mcpConnectionIdSchema>
