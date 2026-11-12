import { requireUser } from '@/modules/identity/presentation/require-user.middleware'
import { os } from '@/platform/rpc/rpc.base'
import { ProjectsService } from '../application/projects.service'

export const projectsRouter = {
	list: os.projects.list.use(requireUser).effect(function* ({ context }) {
		const projectsService = yield* ProjectsService

		return { projects: yield* projectsService.list(context.user.id) }
	}),
	create: os.projects.create.use(requireUser).effect(function* ({
		context,
		input,
	}) {
		const projectsService = yield* ProjectsService

		return { project: yield* projectsService.create(context.user.id, input) }
	}),
	update: os.projects.update.use(requireUser).effect(function* ({
		context,
		input: { id, ...changes },
	}) {
		const projectsService = yield* ProjectsService

		return {
			project: yield* projectsService.update(context.user.id, id, changes),
		}
	}),
	delete: os.projects.delete.use(requireUser).effect(function* ({
		context,
		input,
	}) {
		const projectsService = yield* ProjectsService

		yield* projectsService.delete(context.user.id, input.id)
	}),
}
