import { listTasksInputSchema } from '@soonlane/contracts'
import type { QueryKey } from '@tanstack/react-query'
import { z } from 'zod'

const listKeyOptionsSchema = z.object({ input: listTasksInputSchema })

/** The input of a cached `tasks.list` query (oRPC keys are `[path, { input, type }]`), or `undefined` for a disabled one, such as the Dock badge outside the desktop app, whose input is `skipToken`. */
export function getListInput(key: QueryKey) {
	return listKeyOptionsSchema.safeParse(key[1]).data?.input
}
