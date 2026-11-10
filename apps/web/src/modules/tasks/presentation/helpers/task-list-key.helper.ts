import {
	listTasksByLabelInputSchema,
	listTasksInputSchema,
} from '@soonlane/contracts'
import type { QueryKey } from '@tanstack/react-query'
import { z } from 'zod'

const listKeyOptionsSchema = z.object({ input: listTasksInputSchema })
const anyListKeyOptionsSchema = z.object({
	input: z.union([listTasksInputSchema, listTasksByLabelInputSchema]),
})

/** The input of a cached `tasks.list` query (oRPC keys are `[path, { input, type }]`), or `undefined` for a disabled one, such as the Dock badge outside the desktop app, whose input is `skipToken`. */
export function getListInput(key: QueryKey) {
	return listKeyOptionsSchema.safeParse(key[1]).data?.input
}

/** Like `getListInput`, but also reads a `tasks.listByLabel` query, so an edit can place the task in a label view. */
export function getTaskListInput(key: QueryKey) {
	return anyListKeyOptionsSchema.safeParse(key[1]).data?.input
}
