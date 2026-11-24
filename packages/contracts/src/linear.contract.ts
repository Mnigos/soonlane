import { oc } from '@orpc/contract'
import { z } from 'zod'
import { authErrors } from './auth.errors'

/** `notConfigured`: this server has no Linear app, so the menu hides Linear. `lapsed`: Linear no longer accepts the stored grant, such as a refresh token unused for 30 days. */
export const linearStatusSchema = z.discriminatedUnion('state', [
	z.object({ state: z.literal('notConfigured') }),
	z.object({ state: z.literal('notConnected') }),
	z.object({ state: z.literal('connected'), workspace: z.string() }),
	z.object({ state: z.literal('lapsed') }),
])
export type LinearStatus = z.infer<typeof linearStatusSchema>

export const linearContract = {
	/** Reads the workspace's name from Linear, refreshing the access token first when it is about to expire. */
	status: oc
		.errors({
			...authErrors,
			BAD_GATEWAY: { message: 'Linear could not be read.' },
		})
		.output(linearStatusSchema),
	/** Revokes the grant at Linear and removes the connection; without one it does nothing. Fails, keeping the connection, while Linear has not confirmed the revocation. */
	disconnect: oc
		.errors({
			...authErrors,
			NOT_IMPLEMENTED: { message: 'Linear is not set up.' },
			SERVICE_UNAVAILABLE: {
				message: 'The Linear connection could not be closed.',
			},
		})
		.output(z.void()),
}
