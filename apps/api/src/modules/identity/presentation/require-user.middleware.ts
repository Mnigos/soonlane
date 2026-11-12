import { middlewareGen } from '@orpc/effect'
import { os } from '@/platform/rpc/rpc.base'
import { Unauthorized } from '../domain/identity.errors'

export const requireUser = os.middleware(
	middlewareGen(function* requireUser({ context, next }) {
		if (!context.session) return yield* new Unauthorized()

		return yield* next({ context: { user: context.session.user } })
	})
)
