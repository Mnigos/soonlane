import { requireUser } from '@/modules/identity/presentation/require-user.middleware'
import { os } from '@/platform/rpc/rpc.base'
import { TodoistService } from '../application/todoist.service'

export const todoistRouter = {
	status: os.todoist.status.use(requireUser).effect(function* ({ context }) {
		const todoistService = yield* TodoistService

		return yield* todoistService.status(context.user.id)
	}),
	preview: os.todoist.preview.use(requireUser).effect(function* ({ context }) {
		const todoistService = yield* TodoistService

		return yield* todoistService.preview(context.user.id)
	}),
	cancel: os.todoist.cancel.use(requireUser).effect(function* ({ context }) {
		const todoistService = yield* TodoistService

		yield* todoistService.cancel(context.user.id)
	}),
}
