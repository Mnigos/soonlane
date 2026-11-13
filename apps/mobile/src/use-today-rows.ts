import { useTasksQuery } from '@soonlane/app/tasks/hooks/use-tasks-query'
import { listTasksOutputSchema, type Task } from '@soonlane/contracts'
import { type CalendarDate, getToday } from '@soonlane/domain'
import { useState } from 'react'

export interface TodayRow {
	task: Task
	overdue: boolean
}

/** Today's rows (overdue first) from the shared `tasks.list` query, for both styling variants. */
export function useTodayRows() {
	// Spike: read once; the real app re-reads at midnight and on foreground.
	// oxlint-disable-next-line react/hook-use-state
	const [today] = useState<CalendarDate>(() => getToday(new Date()))
	const query = useTasksQuery({ today, from: today, to: today })
	const rows: TodayRow[] = [
		...(query.data?.overdue ?? []).map(task => ({ task, overdue: true })),
		...(query.data?.scheduled ?? []).map(task => ({ task, overdue: false })),
	]
	// Spike: proves Zod 4 parses on Hermes; the oRPC client itself does not validate output.
	const zodParsed = query.data
		? listTasksOutputSchema.safeParse(query.data).success
		: undefined

	return { today, rows, zodParsed, query }
}
