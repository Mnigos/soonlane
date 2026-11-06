import type { CreateLabelInput, Label } from '@soonlane/contracts'
import type { LabelId, UserId } from '@soonlane/domain'
import { Context, Effect, Layer } from 'effect'
import type { DbError } from '@/platform/db/db.errors'
import { LabelNameTaken, LabelNotFound } from '../domain/label.errors'
import { type LabelChanges, LabelRepository } from './label-repository.port'

export class LabelsService extends Context.Service<
	LabelsService,
	{
		readonly list: (ownerId: UserId) => Effect.Effect<Label[], DbError>
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

		// The unique index on the lower-cased name turns a taken name into no row.
		const create = Effect.fn('LabelsService.create')(function* (
			ownerId: UserId,
			input: CreateLabelInput
		) {
			const label = yield* repository.create({ ...input, ownerId })

			return label ?? (yield* new LabelNameTaken())
		})

		const update = Effect.fn('LabelsService.update')(function* (
			ownerId: UserId,
			id: LabelId,
			changes: LabelChanges
		) {
			if (
				changes.name !== undefined &&
				(yield* repository.isNameTaken({ ownerId, id, name: changes.name }))
			)
				return yield* new LabelNameTaken()

			return yield* requireLabel(
				yield* repository.update({ ...changes, ownerId, id })
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
