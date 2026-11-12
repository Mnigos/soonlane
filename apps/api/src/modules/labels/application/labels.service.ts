import type { CreateLabelInput, Label, ListedLabel } from '@soonlane/contracts'
import { LABEL_OWNER_NAME_INDEX } from '@soonlane/db'
import type { LabelId, UserId } from '@soonlane/domain'
import { Context, Effect, Layer } from 'effect'
import { type DbError, isUniqueViolation } from '@/platform/db/db.errors'
import { LabelNameTaken, LabelNotFound } from '../domain/label.errors'
import {
	type LabelChanges,
	LabelRepository,
} from '../infrastructure/label.repository'

export class LabelsService extends Context.Service<
	LabelsService,
	{
		readonly list: (ownerId: UserId) => Effect.Effect<ListedLabel[], DbError>
		readonly create: (
			ownerId: UserId,
			input: CreateLabelInput
		) => Effect.Effect<Label, LabelNameTaken | DbError>
		readonly update: (
			ownerId: UserId,
			id: LabelId,
			changes: LabelChanges
		) => Effect.Effect<Label, LabelNotFound | LabelNameTaken | DbError>
		readonly delete: (
			ownerId: UserId,
			id: LabelId
		) => Effect.Effect<void, LabelNotFound | DbError>
	}
>()('soonlane/LabelsService') {}

function requireLabel(label: Label | undefined) {
	return label ? Effect.succeed(label) : Effect.fail(new LabelNotFound())
}

export const LabelsServiceLive = Layer.effect(
	LabelsService,
	Effect.gen(function* () {
		const repository = yield* LabelRepository

		const list = Effect.fn('LabelsService.list')(function* (ownerId: UserId) {
			return yield* repository.list(ownerId)
		})

		const create = Effect.fn('LabelsService.create')(function* (
			ownerId: UserId,
			input: CreateLabelInput
		) {
			return yield* repository
				.create({ ...input, ownerId })
				.pipe(
					Effect.catchTag('DbError', error =>
						Effect.fail(
							isUniqueViolation(error, LABEL_OWNER_NAME_INDEX)
								? new LabelNameTaken()
								: error
						)
					)
				)
		})

		const update = Effect.fn('LabelsService.update')(function* (
			ownerId: UserId,
			id: LabelId,
			changes: LabelChanges
		) {
			return yield* requireLabel(
				yield* repository
					.update({ ...changes, ownerId, id })
					.pipe(
						Effect.catchTag('DbError', error =>
							Effect.fail(
								isUniqueViolation(error, LABEL_OWNER_NAME_INDEX)
									? new LabelNameTaken()
									: error
							)
						)
					)
			)
		})

		const remove = Effect.fn('LabelsService.delete')(function* (
			ownerId: UserId,
			id: LabelId
		) {
			yield* requireLabel(yield* repository.delete({ ownerId, id }))
		})

		return LabelsService.of({ list, create, update, delete: remove })
	})
)
