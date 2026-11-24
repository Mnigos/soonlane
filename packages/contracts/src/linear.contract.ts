import { oc } from '@orpc/contract'
import { LINEAR_PINS_PER_TASK_MAX, taskIdSchema } from '@soonlane/domain'
import { z } from 'zod'
import { authErrors } from './auth.errors'
import { linearIssueSchema } from './linear-issue.schemas'
import { taskSchema } from './task.schemas'
import { taskErrors } from './tasks.contract'

/** The answers a Linear read gives without a usable connection; `notConfigured`: this server has no Linear app. */
const unconnectedSchemas = [
	z.object({ state: z.literal('notConfigured') }),
	z.object({ state: z.literal('notConnected') }),
	z.object({ state: z.literal('lapsed') }),
] as const

/** `lapsed`: Linear no longer accepts the stored grant, such as a refresh token unused for 30 days. */
export const linearStatusSchema = z.discriminatedUnion('state', [
	...unconnectedSchemas,
	z.object({ state: z.literal('connected'), workspace: z.string() }),
])
export type LinearStatus = z.infer<typeof linearStatusSchema>

/** `match` says what the query was: empty (`assigned`), text (`search`), an issue's identifier or link (`link`), or a link to anything else (`otherLink`, never sent to Linear). */
export const linearIssueSearchSchema = z.discriminatedUnion('state', [
	...unconnectedSchemas,
	z.object({
		state: z.literal('connected'),
		match: z.enum(['assigned', 'search', 'link', 'otherLink']),
		issues: z.array(linearIssueSchema),
	}),
])
export type LinearIssueSearch = z.infer<typeof linearIssueSearchSchema>

/** Leaves out an issue Linear no longer shows the user. */
export const linearIssuesSchema = z.discriminatedUnion('state', [
	...unconnectedSchemas,
	z.object({
		state: z.literal('connected'),
		issues: z.array(linearIssueSchema),
	}),
])
export type LinearIssues = z.infer<typeof linearIssuesSchema>

export const linearPinInputSchema = z.object({
	id: taskIdSchema,
	issueId: z.string().min(1),
})
export type LinearPinInput = z.infer<typeof linearPinInputSchema>

const linearReadErrors = {
	...authErrors,
	BAD_GATEWAY: { message: 'Linear could not be read.' },
}

export const linearContract = {
	/** Reads the workspace's name from Linear, refreshing the access token first when it is about to expire. */
	status: oc.errors(linearReadErrors).output(linearStatusSchema),
	/** Revokes the grant at Linear and removes the connection; without one it does nothing. Fails, keeping the connection, while Linear has not confirmed the revocation. */
	disconnect: oc
		.errors({
			...authErrors,
			NOT_IMPLEMENTED: { message: 'Linear is not set up.' },
			SERVICE_UNAVAILABLE: {
				message: 'The Linear connection could not be closed.',
			},
		})
		.output(z.void()),
	/** The picker's list: the user's open issues assigned to them for an empty query, the issue an identifier or link names, or Linear's search. */
	searchIssues: oc
		.errors(linearReadErrors)
		.input(z.object({ query: z.string().trim().max(500) }))
		.output(linearIssueSearchSchema),
	/** The current title and status of a task's pins, in one Linear request. */
	listIssues: oc
		.errors(linearReadErrors)
		.input(
			z.object({
				ids: z.array(z.string().min(1)).min(1).max(LINEAR_PINS_PER_TASK_MAX),
			})
		)
		.output(linearIssuesSchema),
	/** Reads the issue from Linear and pins it as it reads now; pinning it again refreshes the stored title. `NOT_FOUND` is the task's, or an issue Linear does not show the user. */
	pin: oc
		.errors({
			...taskErrors,
			...linearReadErrors,
			PRECONDITION_FAILED: { message: 'Linear is not connected.' },
			CONFLICT: {
				message: `A task can pin up to ${LINEAR_PINS_PER_TASK_MAX} Linear issues.`,
			},
		})
		.input(linearPinInputSchema)
		.output(z.object({ task: taskSchema })),
	/** Needs no connection; an issue the task has not pinned changes nothing. */
	unpin: oc
		.errors(taskErrors)
		.input(linearPinInputSchema)
		.output(z.object({ task: taskSchema })),
}
