import { oc } from '@orpc/contract'
import { PROJECT_NAME_MAX_LENGTH, projectIdSchema } from '@soonlane/domain'
import { z } from 'zod'
import { authErrors } from './auth.errors'
import { query } from './read-only.base'

const projectNameSchema = z.string().trim().min(1).max(PROJECT_NAME_MAX_LENGTH)

export const projectSchema = z.object({
	id: projectIdSchema,
	name: z.string(),
})
export type Project = z.infer<typeof projectSchema>

export const listedProjectSchema = projectSchema.extend({
	openTaskCount: z.number().int().nonnegative(),
})
export type ListedProject = z.infer<typeof listedProjectSchema>

export const createProjectInputSchema = z.object({ name: projectNameSchema })
export type CreateProjectInput = z.infer<typeof createProjectInputSchema>

export const updateProjectInputSchema = z.object({
	id: projectIdSchema,
	name: projectNameSchema,
})
export type UpdateProjectInput = z.infer<typeof updateProjectInputSchema>

export const projectIdInputSchema = z.object({ id: projectIdSchema })
export type ProjectIdInput = z.infer<typeof projectIdInputSchema>

export const projectNotFound = { message: 'This project no longer exists.' }
const projectNameTaken = { message: 'A project with this name already exists.' }

export const projectsContract = {
	list: query
		.errors(authErrors)
		.output(z.object({ projects: z.array(listedProjectSchema) })),
	create: oc
		.errors({ ...authErrors, CONFLICT: projectNameTaken })
		.input(createProjectInputSchema)
		.output(z.object({ project: projectSchema })),
	update: oc
		.errors({
			...authErrors,
			NOT_FOUND: projectNotFound,
			CONFLICT: projectNameTaken,
		})
		.input(updateProjectInputSchema)
		.output(z.object({ project: projectSchema })),
	delete: oc
		.errors({ ...authErrors, NOT_FOUND: projectNotFound })
		.input(projectIdInputSchema)
		.output(z.void()),
}
