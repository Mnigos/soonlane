import { requireUser } from '@/modules/identity/presentation/require-user.middleware'
import { os } from '@/platform/rpc/rpc.base'
import { LabelsService } from '../application/labels.service'

export const labelsRouter = {
	list: os.labels.list.use(requireUser).effect(function* ({ context }) {
		const labelsService = yield* LabelsService

		return { labels: yield* labelsService.list(context.user.id) }
	}),
	create: os.labels.create.use(requireUser).effect(function* ({
		context,
		input,
	}) {
		const labelsService = yield* LabelsService

		return { label: yield* labelsService.create(context.user.id, input) }
	}),
	update: os.labels.update.use(requireUser).effect(function* ({
		context,
		input: { id, ...changes },
	}) {
		const labelsService = yield* LabelsService

		return {
			label: yield* labelsService.update(context.user.id, id, changes),
		}
	}),
	delete: os.labels.delete.use(requireUser).effect(function* ({
		context,
		input,
	}) {
		const labelsService = yield* LabelsService

		yield* labelsService.delete(context.user.id, input.id)
	}),
}
