import { requireUser } from '@/modules/identity/presentation/require-user.middleware'
import { os } from '@/platform/rpc/rpc.base'
import { LinearService } from '../application/linear.service'

export const linearRouter = {
	status: os.linear.status.use(requireUser).effect(function* ({ context }) {
		const linearService = yield* LinearService

		return yield* linearService.status(context.user.id)
	}),
	disconnect: os.linear.disconnect.use(requireUser).effect(function* ({
		context,
	}) {
		const linearService = yield* LinearService

		yield* linearService.disconnect(context.user.id)
	}),
}
