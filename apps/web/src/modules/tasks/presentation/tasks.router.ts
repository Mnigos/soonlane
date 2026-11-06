import { toTaskId } from '@soonlane/domain'
import { requireOwner } from '@/modules/identity/presentation/require-owner.middleware'
import { os } from '@/platform/rpc/rpc.base'
import { TasksService } from '../application/tasks.service'

export const tasksRouter = {
	list: os.tasks.list.use(requireOwner).effect(function* ({ context, input }) {
		const tasksService = yield* TasksService

		return yield* tasksService.list(context.owner.id, input)
	}),
	create: os.tasks.create.use(requireOwner).effect(function* ({
		context,
		input,
	}) {
		const tasksService = yield* TasksService

		return { task: yield* tasksService.create(context.owner.id, input) }
	}),
	complete: os.tasks.complete.use(requireOwner).effect(function* ({
		context,
		input,
	}) {
		const tasksService = yield* TasksService

		return {
			task: yield* tasksService.complete(context.owner.id, toTaskId(input.id)),
		}
	}),
	uncomplete: os.tasks.uncomplete.use(requireOwner).effect(function* ({
		context,
		input,
	}) {
		const tasksService = yield* TasksService

		return {
			task: yield* tasksService.uncomplete(
				context.owner.id,
				toTaskId(input.id)
			),
		}
	}),
}
