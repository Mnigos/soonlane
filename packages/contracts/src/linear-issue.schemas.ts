import { z } from 'zod'

/** A Linear issue pinned to a task, as it read at pinning; the URL is Linear's own and opens the issue. */
export const linearPinSchema = z.object({
	issueId: z.string(),
	identifier: z.string(),
	title: z.string(),
	url: z.url({ protocol: /^https$/u }),
})
export type LinearPin = z.infer<typeof linearPinSchema>

/** An issue as Linear answers now; `state.type` is Linear's workflow state type (`backlog`, `unstarted`, `started`, `completed`, `canceled`, `triage`). */
export const linearIssueSchema = linearPinSchema.extend({
	state: z.object({ type: z.string(), color: z.string(), name: z.string() }),
})
export type LinearIssue = z.infer<typeof linearIssueSchema>
