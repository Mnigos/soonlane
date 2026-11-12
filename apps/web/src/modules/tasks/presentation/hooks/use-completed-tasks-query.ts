import { orpcQuery } from '@soonlane/app/rpc-query'
import { type CalendarDate, addDays, getStartOfDay } from '@soonlane/domain'
import { useQuery } from '@tanstack/react-query'

/** Tasks completed during the local day `today`; both bounds derive from it, so the query key holds all day. */
export function useCompletedTasksQuery(today: CalendarDate) {
	return useQuery(
		orpcQuery.tasks.listCompleted.queryOptions({
			input: {
				from: getStartOfDay(today),
				to: getStartOfDay(addDays(today, 1)),
			},
		})
	)
}
