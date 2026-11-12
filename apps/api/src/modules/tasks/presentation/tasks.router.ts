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
	listByProject: os.tasks.listByProject.use(requireUser).effect(function* ({
		context,
		input,
	}) {
		const tasksService = yield* TasksService

		return yield* tasksService.listByProject(context.user.id, input)
	}),
	listCompleted: os.tasks.listCompleted.use(requireUser).effect(function* ({
		context,
		input,
	}) {
		const tasksService = yield* TasksService

		return { tasks: yield* tasksService.listCompleted(context.user.id, input) }
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

		return yield* tasksService.update(context.user.id, input.id, input)
	}),
	delete: os.tasks.delete.use(requireUser).effect(function* ({
		context,
		input,
	}) {
		const tasksService = yield* TasksService

		yield* tasksService.delete(context.user.id, input.id)
	}),
	complete: os.tasks.complete.use(requireUser).effect(function* ({
		context,
		input,
	}) {
		const tasksService = yield* TasksService

		return {
			task: yield* tasksService.complete(context.user.id, input.id, input),
		}
	}),
	uncomplete: os.tasks.uncomplete.use(requireUser).effect(function* ({
		context,
		input,
	}) {
		const tasksService = yield* TasksService

		return {
			task: yield* tasksService.uncomplete(context.user.id, input.id, {
				dueDate: input.dueDate,
				progress: input.progress,
				goal: input.goal,
			}),
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
				input.id,
				input.labelId
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
				input.id,
				input.labelId
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
			input.id,
			input.amount,
			input
		)
	}),
}
