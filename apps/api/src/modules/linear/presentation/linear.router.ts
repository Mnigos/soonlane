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
	searchIssues: os.linear.searchIssues.use(requireUser).effect(function* ({
		context,
		input,
	}) {
		const linearService = yield* LinearService

		return yield* linearService.searchIssues(context.user.id, input.query)
	}),
	listIssues: os.linear.listIssues.use(requireUser).effect(function* ({
		context,
		input,
	}) {
		const linearService = yield* LinearService

		return yield* linearService.listIssues(context.user.id, input.ids)
	}),
	pin: os.linear.pin.use(requireUser).effect(function* ({ context, input }) {
		const linearService = yield* LinearService

		return {
			task: yield* linearService.pin(context.user.id, input.id, input.issueId),
		}
	}),
	unpin: os.linear.unpin.use(requireUser).effect(function* ({
		context,
		input,
	}) {
		const linearService = yield* LinearService

		return {
			task: yield* linearService.unpin(
				context.user.id,
				input.id,
				input.issueId
			),
		}
	}),
}
