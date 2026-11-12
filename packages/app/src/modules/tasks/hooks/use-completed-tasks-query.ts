import { type CalendarDate, addDays, getStartOfDay } from '@soonlane/domain'
import { useQuery } from '@tanstack/react-query'
import { orpcQuery } from '../../../rpc-query.client'

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
