import { toCalendarDate, toLabelId, toTaskId } from '@soonlane/domain'
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
	update: os.tasks.update.use(requireOwner).effect(function* ({
		context,
		input,
	}) {
		const tasksService = yield* TasksService

		return {
			task: yield* tasksService.update(
				context.owner.id,
				toTaskId(input.id),
				input
			),
		}
	}),
	complete: os.tasks.complete.use(requireOwner).effect(function* ({
		context,
		input,
	}) {
		const tasksService = yield* TasksService

		return {
			task: yield* tasksService.complete(context.owner.id, toTaskId(input.id), {
				today: input.today ? toCalendarDate(input.today) : undefined,
				dueDate: input.dueDate ? toCalendarDate(input.dueDate) : undefined,
			}),
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
				toTaskId(input.id),
				input.dueDate ? toCalendarDate(input.dueDate) : undefined
			),
		}
	}),
	reschedule: os.tasks.reschedule.use(requireOwner).effect(function* ({
		context,
		input,
	}) {
		const tasksService = yield* TasksService

		return { tasks: yield* tasksService.reschedule(context.owner.id, input) }
	}),
	assignLabel: os.tasks.assignLabel.use(requireOwner).effect(function* ({
		context,
		input,
	}) {
		const tasksService = yield* TasksService

		return {
			task: yield* tasksService.assignLabel(
				context.owner.id,
				toTaskId(input.id),
				toLabelId(input.labelId)
			),
		}
	}),
	unassignLabel: os.tasks.unassignLabel.use(requireOwner).effect(function* ({
		context,
		input,
	}) {
		const tasksService = yield* TasksService

		return {
			task: yield* tasksService.unassignLabel(
				context.owner.id,
				toTaskId(input.id),
				toLabelId(input.labelId)
			),
		}
	}),
}
