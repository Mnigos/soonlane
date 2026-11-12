import {
	type CalendarDate,
	addDays,
	getStartOfDay,
	getToday,
} from '@soonlane/domain'
import { useInfiniteQuery } from '@tanstack/react-query'
import { orpcQuery } from '../../../rpc-query.client'

const WINDOW_DAYS = 14

/** The end of the window that holds the local day of `completedAt` as its last day. */
function getWindowEnd(completedAt: Date) {
	return addDays(getToday(completedAt), 1)
}

/**
 * Completed tasks in windows of local days, newest first; a page's param is the day after its window.
 * The next window ends with the latest earlier completion, so empty stretches are skipped.
 */
export function useCompletedHistoryQuery(today: CalendarDate) {
	const options = orpcQuery.tasks.listCompleted.infiniteOptions({
		input: (end: CalendarDate) => ({
			from: getStartOfDay(addDays(end, -WINDOW_DAYS)),
			to: getStartOfDay(end),
		}),
		initialPageParam: addDays(today, 1),
		getNextPageParam: ({ earlierCompletedAt }) =>
			earlierCompletedAt && getWindowEnd(earlierCompletedAt),
	})

	return useInfiniteQuery({
		...options,
		queryFn: async context => {
			const page = await options.queryFn(context)

			if (page.tasks.length > 0 || !page.earlierCompletedAt) return page

			return await options.queryFn({
				...context,
				pageParam: getWindowEnd(page.earlierCompletedAt),
			})
		},
	})
}
