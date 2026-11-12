import { oc } from '@orpc/contract'
import { TODOIST_IMPORT_CHANGES } from '@soonlane/domain'
import { z } from 'zod'
import { authErrors } from './auth.errors'
import { query } from './read-only.base'

const countSchema = z.int().nonnegative()

export const todoistStatusSchema = z.object({
	/** Whether this server has a Todoist app; without one the import is hidden. */
	configured: z.boolean(),
	connected: z.boolean(),
})
export type TodoistStatus = z.infer<typeof todoistStatusSchema>

/** What an import would bring in and what it would change or leave out; nothing is saved. */
export const todoistPreviewSchema = z.object({
	tasks: countSchema,
	newLabels: countSchema,
	existingLabels: countSchema,
	newProjects: countSchema,
	existingProjects: countSchema,
	changes: z.record(z.enum(TODOIST_IMPORT_CHANGES), countSchema),
})
export type TodoistPreview = z.infer<typeof todoistPreviewSchema>

const notConfigured = {
	NOT_IMPLEMENTED: { message: 'Importing from Todoist is not set up.' },
}

export const todoistContract = {
	status: query.errors(authErrors).output(todoistStatusSchema),
	/** Reads the connected account once; a failed read or an expired connection closes it. */
	preview: oc
		.errors({
			...authErrors,
			...notConfigured,
			NOT_FOUND: { message: 'No Todoist account is connected.' },
			GONE: { message: 'The Todoist connection expired.' },
			BAD_GATEWAY: { message: 'Todoist could not be read.' },
		})
		.output(todoistPreviewSchema),
	/** Revokes and removes the connection; without one it does nothing. Fails while Todoist has not confirmed a revocation, and the connection stays for the sweep. */
	cancel: oc
		.errors({
			...authErrors,
			...notConfigured,
			SERVICE_UNAVAILABLE: {
				message: 'The Todoist connection could not be closed yet.',
			},
		})
		.output(z.void()),
}
