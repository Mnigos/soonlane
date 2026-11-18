import { os } from '@/platform/rpc/rpc.base'
import { Auth } from '../application/auth.port'

export const identityRouter = {
	me: os.identity.me.handler(({ context }) => {
		const user = context.session?.user

		if (!user) return { user: null }

		return {
			user: {
				id: user.id,
				email: user.email,
				// An email-code account starts without a name.
				name: user.name || user.email,
				image: user.image,
			},
		}
	}),
	signInMethods: os.identity.signInMethods.effect(function* () {
		return (yield* Auth).signInMethods
	}),
}
