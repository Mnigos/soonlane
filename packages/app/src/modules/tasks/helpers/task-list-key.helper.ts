import { listTasksInputSchema } from '@soonlane/contracts'
import type { CalendarDate } from '@soonlane/domain'
import type { QueryKey } from '@tanstack/react-query'
import { z } from 'zod'

/** The Today list's input: overdue tasks and the ones due today. */
export function getTodayListInput(today: CalendarDate) {
	return { from: today, to: today, today }
}

const listKeyOptionsSchema = z.object({ input: listTasksInputSchema })

/** The input of a cached `tasks.list` query (oRPC keys are `[path, { input, type }]`), or `undefined` for a disabled one, such as the Dock badge outside the desktop app, whose input is `skipToken`. */
export function getListInput(key: QueryKey) {
	return listKeyOptionsSchema.safeParse(key[1]).data?.input
}
