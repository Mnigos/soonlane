import { userIdSchema } from '@soonlane/domain'
import { z } from 'zod'
import { query } from './read-only.base'

export const sessionUserSchema = z.object({
	id: userIdSchema,
	email: z.email(),
	name: z.string(),
	image: z.string().optional(),
})
export type SessionUser = z.infer<typeof sessionUserSchema>

export const identityContract = {
	me: query.output(z.object({ user: sessionUserSchema.nullable() })),
}
