import { oc } from '@orpc/contract'
import {
	LABEL_COLORS,
	LABEL_NAME_MAX_LENGTH,
	labelIdSchema,
} from '@soonlane/domain'
import { z } from 'zod'
import { authErrors } from './auth.errors'

const labelNameSchema = z.string().trim().min(1).max(LABEL_NAME_MAX_LENGTH)
const labelColorSchema = z.enum(LABEL_COLORS)

export const labelSchema = z.object({
	id: labelIdSchema,
	name: z.string(),
	color: labelColorSchema.optional(),
})

export type Label = z.infer<typeof labelSchema>

export const listedLabelSchema = labelSchema.extend({
	openTaskCount: z.number().int().nonnegative(),
})

export type ListedLabel = z.infer<typeof listedLabelSchema>

export const createLabelInputSchema = z.object({
	name: labelNameSchema,
	color: labelColorSchema.optional(),
})

export type CreateLabelInput = z.infer<typeof createLabelInputSchema>

export const updateLabelInputSchema = z
	.object({
		id: labelIdSchema,
		name: labelNameSchema.optional(),
		color: labelColorSchema.nullable().optional(),
	})
	.refine(({ name, color }) => name !== undefined || color !== undefined, {
		message: 'Change the name, the color or both.',
	})

export type UpdateLabelInput = z.infer<typeof updateLabelInputSchema>

export const labelIdInputSchema = z.object({ id: labelIdSchema })

export type LabelIdInput = z.infer<typeof labelIdInputSchema>

export const labelNotFound = { message: 'This label no longer exists.' }
const labelNameTaken = { message: 'A label with this name already exists.' }

export const labelsContract = {
	list: oc
		.errors(authErrors)
		.output(z.object({ labels: z.array(listedLabelSchema) })),
	create: oc
		.errors({ ...authErrors, CONFLICT: labelNameTaken })
		.input(createLabelInputSchema)
		.output(z.object({ label: labelSchema })),
	update: oc
		.errors({
			...authErrors,
			NOT_FOUND: labelNotFound,
			CONFLICT: labelNameTaken,
		})
		.input(updateLabelInputSchema)
		.output(z.object({ label: labelSchema })),
	delete: oc
		.errors({ ...authErrors, NOT_FOUND: labelNotFound })
		.input(labelIdInputSchema)
		.output(z.void()),
}
