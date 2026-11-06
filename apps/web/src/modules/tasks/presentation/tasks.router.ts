import { toCalendarDate, toLabelId, toTaskId } from '@soonlane/domain'
import { requireUser } from '@/modules/identity/presentation/require-user.middleware'
import { os } from '@/platform/rpc/rpc.base'
import { TasksService } from '../application/tasks.service'

export const tasksRouter = {
	list: os.tasks.list.use(requireUser).effect(function* ({ context, input }) {
		const tasksService = yield* TasksService

		return yield* tasksService.list(context.user.id, input)
	}),
	listByLabel: os.tasks.listByLabel.use(requireUser).effect(function* ({
		context,
		input,
	}) {
		const tasksService = yield* TasksService

		return yield* tasksService.listByLabel(context.user.id, input)
	}),
	create: os.tasks.create.use(requireUser).effect(function* ({
		context,
		input,
	}) {
		const tasksService = yield* TasksService

		return { task: yield* tasksService.create(context.user.id, input) }
	}),
	update: os.tasks.update.use(requireUser).effect(function* ({
		context,
		input,
	}) {
		const tasksService = yield* TasksService

		return {
			task: yield* tasksService.update(
				context.user.id,
				toTaskId(input.id),
				input
			),
		}
	}),
	complete: os.tasks.complete.use(requireUser).effect(function* ({
		context,
		input,
	}) {
		const tasksService = yield* TasksService

		return {
			task: yield* tasksService.complete(context.user.id, toTaskId(input.id), {
				today: input.today ? toCalendarDate(input.today) : undefined,
				dueDate: input.dueDate ? toCalendarDate(input.dueDate) : undefined,
			}),
		}
	}),
	uncomplete: os.tasks.uncomplete.use(requireUser).effect(function* ({
		context,
		input,
	}) {
		const tasksService = yield* TasksService

		return {
			task: yield* tasksService.uncomplete(
				context.user.id,
				toTaskId(input.id),
				input.dueDate ? toCalendarDate(input.dueDate) : undefined
			),
		}
	}),
	reschedule: os.tasks.reschedule.use(requireUser).effect(function* ({
		context,
		input,
	}) {
		const tasksService = yield* TasksService

		return { tasks: yield* tasksService.reschedule(context.user.id, input) }
	}),
	assignLabel: os.tasks.assignLabel.use(requireUser).effect(function* ({
		context,
		input,
	}) {
		const tasksService = yield* TasksService

		return {
			task: yield* tasksService.assignLabel(
				context.user.id,
				toTaskId(input.id),
				toLabelId(input.labelId)
			),
		}
	}),
	unassignLabel: os.tasks.unassignLabel.use(requireUser).effect(function* ({
		context,
		input,
	}) {
		const tasksService = yield* TasksService

		return {
			task: yield* tasksService.unassignLabel(
				context.user.id,
				toTaskId(input.id),
				toLabelId(input.labelId)
			),
		}
	}),
	logProgress: os.tasks.logProgress.use(requireUser).effect(function* ({
		context,
		input,
	}) {
		const tasksService = yield* TasksService

		return yield* tasksService.logProgress(
			context.user.id,
			toTaskId(input.id),
			input.amount
		)
	}),
}
