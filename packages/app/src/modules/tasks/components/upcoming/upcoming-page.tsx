import type { RangeLoadTrigger, UpcomingNavigation } from '@soonlane/analytics'
import { capture } from '@soonlane/analytics/client'
import {
	type CalendarDate,
	addDays,
	getDaysBetween,
	isBefore,
	UPCOMING_WEEK_COUNT,
	UPCOMING_WEEKS_PER_LOAD,
	getActiveDayLabel,
	getUpcomingLastDay,
	getUpcomingRanges,
	getWeekStrip,
} from '@soonlane/domain'
import { useCallback, useState } from 'react'
import { flushSync } from 'react-dom'
import { useActiveDay } from '../../hooks/use-active-day'
import { useCompleteTask } from '../../hooks/use-complete-task'
import { useTasksQuery } from '../../hooks/use-tasks-query'
import { OverdueSection } from '../list/overdue-section'
import { TaskListError } from '../list/task-list-error'
import { UndatedSection } from '../list/undated-section'
import { OpenEditorProvider } from '../open-editor-provider'
import { UpcomingRange } from './upcoming-range'
import { WeekControls } from './week-controls'
import { WeekStrip } from './week-strip'

interface UpcomingPageProps {
	today: CalendarDate
}

export function UpcomingPage({ today }: Readonly<UpcomingPageProps>) {
	const [weekCount, setWeekCount] = useState(UPCOMING_WEEK_COUNT)
	const ranges = getUpcomingRanges(today, weekCount)
	const lastDay = getUpcomingLastDay(today, weekCount)
	const { activeDay, headerRef, sectionRef, scrollToDay } = useActiveDay(today)
	const strip = getWeekStrip(today, activeDay)
	const previousDay = isBefore(today, activeDay)
		? addDays(activeDay, -1)
		: undefined
	const nextDay = addDays(activeDay, 1)
	// The first range's query, shared with its section list, also brings the undated and overdue tasks.
	const { data, isPending, isError, refetch } = useTasksQuery({
		from: today,
		to: getUpcomingLastDay(today, UPCOMING_WEEK_COUNT),
		today,
	})
	const { completeTask } = useCompleteTask(today)
	const loadMore = useCallback(
		(trigger: RangeLoadTrigger) => {
			capture('upcoming_range_loaded', {
				weeksLoaded: weekCount + UPCOMING_WEEKS_PER_LOAD,
				trigger,
			})
			setWeekCount(count => count + UPCOMING_WEEKS_PER_LOAD)
		},
		[weekCount]
	)
	const loadMoreOnScroll = useCallback(() => loadMore('scroll'), [loadMore])

	function goTo(day: CalendarDate, direction: UpcomingNavigation) {
		capture('upcoming_day_navigated', {
			direction,
			distanceDays: Math.abs(getDaysBetween(activeDay, day)),
		})
		scrollToDay(day)
	}

	function goToNextDay() {
		// Past the last rendered day, append the next weeks first, so the day exists to scroll to.
		if (isBefore(lastDay, nextDay)) flushSync(() => loadMore('navigation'))
		goTo(nextDay, 'next')
	}

	// Room below the last day so it can scroll up under the sticky header (at least 6rem tall) while the next weeks load.
	return (
		<OpenEditorProvider>
			<main className="mx-auto w-full max-w-3xl px-6 pb-[calc(100dvh-6rem)] md:px-10">
				<header
					className="sticky top-0 z-10 flex flex-col gap-3 border-b bg-background pt-1 md:pt-4"
					ref={headerRef}
				>
					<div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-3">
						<span aria-hidden className="hidden sm:block" />

						<div className="flex flex-col items-start sm:items-center sm:text-center">
							<h1 className="text-xl font-bold">Upcoming</h1>

							<p className="text-label text-muted-foreground">
								{strip.monthLabel}
							</p>
						</div>

						<div className="flex justify-end">
							<WeekControls
								activeDayLabel={getActiveDayLabel(activeDay, today)}
								onNext={goToNextDay}
								onPrevious={
									previousDay && (() => goTo(previousDay, 'previous'))
								}
								onToday={() => goTo(today, 'today')}
							/>
						</div>
					</div>

					<WeekStrip days={strip.days} onSelect={day => goTo(day, 'strip')} />
				</header>

				{isError && <TaskListError onRetry={() => void refetch()} />}

				<UndatedSection
					heading="Inbox"
					onComplete={completeTask}
					tasks={data?.undated ?? []}
					today={today}
				/>

				<OverdueSection
					isLoading={isPending}
					onComplete={completeTask}
					tasks={data?.overdue ?? []}
					today={today}
				/>

				{ranges.map(({ from, to }, index) => (
					<UpcomingRange
						from={from}
						key={from}
						onComplete={completeTask}
						onLoadMore={
							index === ranges.length - 1 ? loadMoreOnScroll : undefined
						}
						sectionRef={sectionRef}
						showsError={index > 0}
						to={to}
						today={today}
					/>
				))}
			</main>
		</OpenEditorProvider>
	)
}
