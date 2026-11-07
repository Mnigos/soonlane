import type {
	CreateLabelInput,
	Label,
	UpdateLabelInput,
} from '@soonlane/contracts'
import type { LabelId, UserId } from '@soonlane/domain'
import { Context, type Effect } from 'effect'
import type { DbError } from '@/platform/db/db.errors'

export interface OwnedLabel {
	ownerId: UserId
	id: LabelId
}

export interface NewLabel extends CreateLabelInput {
	ownerId: UserId
}

export type LabelChanges = Omit<UpdateLabelInput, 'id'>

export interface LabelChange extends OwnedLabel, LabelChanges {}

export class LabelRepository extends Context.Service<
	LabelRepository,
	{
		readonly list: (ownerId: UserId) => Effect.Effect<Label[], DbError>
		readonly create: (label: NewLabel) => Effect.Effect<Label, DbError>
		readonly update: (
			change: LabelChange
		) => Effect.Effect<Label | undefined, DbError>
		readonly delete: (
			label: OwnedLabel
		) => Effect.Effect<Label | undefined, DbError>
	}
>()('soonlane/LabelRepository') {}
