import { os } from '@/platform/rpc/rpc.base'

/** `me.configured` is always true: the API does not start without Google's client id and secret. */
export const identityRouter = {
	me: os.identity.me.handler(({ context }) => {
		const user = context.session?.user

		if (!user) return { user: null, configured: true }

		return {
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				image: user.image,
			},
			configured: true,
		}
	}),
}
