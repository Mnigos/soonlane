import { isOwner } from '@soonlane/auth'
import { AppConfig } from '@/platform/config/app.config'
import { os } from '@/platform/rpc/rpc.base'
import { Auth } from '../application/auth.port'

export const identityRouter = {
	me: os.identity.me.effect(function* ({ context }) {
		const { configured } = yield* Auth
		const { ownerEmail } = yield* AppConfig
		const user = context.session?.user

		if (!(user && isOwner(user, ownerEmail))) return { user: null, configured }

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
