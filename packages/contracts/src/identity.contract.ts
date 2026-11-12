import { oc } from '@orpc/contract'
import { userIdSchema } from '@soonlane/domain'
import { z } from 'zod'

export const sessionUserSchema = z.object({
	id: userIdSchema,
	email: z.email(),
	name: z.string(),
	image: z.string().optional(),
})

export type SessionUser = z.infer<typeof sessionUserSchema>

export const identityContract = {
	me: oc.output(
		z.object({
			user: sessionUserSchema.nullable(),
			configured: z.boolean(),
		})
	),
}
