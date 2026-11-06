import { middlewareGen } from '@orpc/experimental-effect'
import { isOwner } from '@soonlane/auth'
import { AppConfig } from '@/platform/config/app.config'
import { os } from '@/platform/rpc/rpc.base'
import { Forbidden, Unauthorized } from '../domain/identity.errors'

export const requireOwner = os.middleware(
	middlewareGen(function* requireOwner({ context, next }) {
		const { ownerEmail } = yield* AppConfig

		if (!context.session) return yield* new Unauthorized()
		if (!isOwner(context.session.user, ownerEmail))
			return yield* new Forbidden()

		return yield* next({ context: { owner: context.session.user } })
	})
)
