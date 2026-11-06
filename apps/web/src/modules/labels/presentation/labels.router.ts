import { toLabelId } from '@soonlane/domain'
import { requireOwner } from '@/modules/identity/presentation/require-owner.middleware'
import { os } from '@/platform/rpc/rpc.base'
import { LabelsService } from '../application/labels.service'

export const labelsRouter = {
	list: os.labels.list.use(requireOwner).effect(function* ({ context }) {
		const labelsService = yield* LabelsService

		return { labels: yield* labelsService.list(context.owner.id) }
	}),
	create: os.labels.create.use(requireOwner).effect(function* ({
		context,
		input,
	}) {
		const labelsService = yield* LabelsService

		return { label: yield* labelsService.create(context.owner.id, input) }
	}),
	update: os.labels.update.use(requireOwner).effect(function* ({
		context,
		input: { id, ...changes },
	}) {
		const labelsService = yield* LabelsService

		return {
			label: yield* labelsService.update(
				context.owner.id,
				toLabelId(id),
				changes
			),
		}
	}),
	delete: os.labels.delete.use(requireOwner).effect(function* ({
		context,
		input,
	}) {
		const labelsService = yield* LabelsService

		yield* labelsService.delete(context.owner.id, toLabelId(input.id))
	}),
}
