import { getHostPorts } from '@soonlane/app/host-ports'
import { orpcQuery } from '@soonlane/app/rpc-query'
import { groupTasksByDay } from '@soonlane/app/tasks/helpers/task-list.helper'
import {
	type CalendarDate,
	getDayHeading,
	getDaysThrough,
	getUpcomingRanges,
	UPCOMING_WEEK_COUNT,
	UPCOMING_WEEKS_PER_LOAD,
} from '@soonlane/domain'
import { useQueries } from '@tanstack/react-query'
import { useState } from 'react'
import { TaskSectionList } from './task-section-list'

interface UpcomingScreenProps {
	today: CalendarDate
}

/** Every day from today, loaded in the web's ranges with the same query keys, so a range the web would share is shared here too. */
export function UpcomingScreen({ today }: Readonly<UpcomingScreenProps>) {
	const [weekCount, setWeekCount] = useState(UPCOMING_WEEK_COUNT)
	const ranges = getUpcomingRanges(today, weekCount)
	const rangeQueries = useQueries({
		queries: ranges.map(({ from, to }) =>
			orpcQuery.tasks.list.queryOptions({ input: { from, to, today } })
		),
	})
	const tasksByDay = groupTasksByDay(
		rangeQueries.flatMap(({ data }) => data?.scheduled ?? [])
	)
	const isError = rangeQueries.some(query => query.isError)
	const isLastRangeLoaded = rangeQueries.at(-1)?.isSuccess === true

	function loadMore() {
		getHostPorts().capture('upcoming_range_loaded', {
			weeksLoaded: weekCount + UPCOMING_WEEKS_PER_LOAD,
			trigger: 'scroll',
		})
		setWeekCount(count => count + UPCOMING_WEEKS_PER_LOAD)
	}

	return (
		<TaskSectionList
			isError={isError}
			onEndReached={isLastRangeLoaded ? loadMore : undefined}
			sections={ranges.flatMap(({ from, to }, index) =>
				getDaysThrough(from, to).map(date => ({
					key: date,
					heading: getDayHeading(date, today),
					isMuted: date !== today,
					isLoading: rangeQueries[index]?.isPending ?? true,
					data: tasksByDay.get(date) ?? [],
				}))
			)}
			title="Upcoming"
			today={today}
		/>
	)
}
