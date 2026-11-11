import type { Task } from '@soonlane/contracts'
import type { CalendarDate } from '@soonlane/domain'
import { memo, type RefCallback, useMemo } from 'react'
import { getDaysThrough } from '../../../domain/upcoming-view.helper'
import { groupTasksByDay } from '../../helpers/task-list.helper'
import { useTasksQuery } from '../../hooks/use-tasks-query'
import { DaySection } from '../list/day-section'
import { TaskListError } from '../list/task-list-error'

interface UpcomingRangeProps {
	from: CalendarDate
	to: CalendarDate
	today: CalendarDate
	/** The first range's error is shown above Overdue instead. */
	showsError: boolean
	onComplete: (task: Task) => void
	sectionRef: (date: CalendarDate) => RefCallback<HTMLElement>
	/** Given to the last range only: appends more days when its end comes near. */
	onLoadMore?: () => void
}

/** Pixels, since browsers differ on what a percentage margin refers to. */
const LOAD_MORE_MARGIN = '0px 0px 1000px 0px'

/**
 * One loaded stretch of the Upcoming list with its own tasks query, so a range
 * that loads or fails never hides the tasks of the others. Memoized, so
 * scrolling (which changes the active day) does not re-render every day.
 */
export const UpcomingRange = memo(function UpcomingRange({
	from,
	to,
	today,
	showsError,
	onComplete,
	sectionRef,
	onLoadMore,
}: Readonly<UpcomingRangeProps>) {
	const { data, isPending, isError, refetch } = useTasksQuery({
		from,
		to,
		today,
	})
	const days = useMemo(() => getDaysThrough(from, to), [from, to])
	const tasksByDay = useMemo(
		() => groupTasksByDay(data?.scheduled ?? []),
		[data]
	)

	return (
		<>
			{showsError && isError && (
				<TaskListError onRetry={() => void refetch()} />
			)}

			{days.map(date => (
				<DaySection
					date={date}
					isLoading={isPending}
					key={date}
					onComplete={onComplete}
					ref={sectionRef(date)}
					tasks={tasksByDay.get(date) ?? []}
					today={today}
				/>
			))}

			{onLoadMore && !isError && (
				<div
					aria-hidden
					key={to}
					ref={element => {
						// One load per marker: appending a range moves the marker to the new last range.
						const observer = new IntersectionObserver(
							entries => {
								if (!entries.some(entry => entry.isIntersecting)) return

								observer.disconnect()
								onLoadMore()
							},
							{ rootMargin: LOAD_MORE_MARGIN }
						)

						if (element) observer.observe(element)

						return () => observer.disconnect()
					}}
				/>
			)}
		</>
	)
})
