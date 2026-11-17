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

/** Which ways in this server offers; a self-hosted copy may run without Google or without mail. */
export const signInMethodsSchema = z.object({
	google: z.boolean(),
	emailCode: z.boolean(),
})
export type SignInMethods = z.infer<typeof signInMethodsSchema>

export const identityContract = {
	me: oc.output(z.object({ user: sessionUserSchema.nullable() })),
	/** Public: the sign-in screens ask it before anyone is signed in. */
	signInMethods: oc.output(signInMethodsSchema),
}
