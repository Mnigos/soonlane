import { os } from '@/platform/rpc/rpc.base'
import { Auth } from '../application/auth.port'

export const identityRouter = {
	me: os.identity.me.effect(function* ({ context }) {
		const { configured } = yield* Auth
		const user = context.session?.user

		if (!user) return { user: null, configured }

		return {
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				image: user.image,
			},
			configured,
		}
	}),
}
