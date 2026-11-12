import { os } from '@/platform/rpc/rpc.base'

export const identityRouter = {
	me: os.identity.me.handler(({ context }) => {
		const user = context.session?.user

		if (!user) return { user: null }

		return {
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				image: user.image,
			},
		}
	}),
}
