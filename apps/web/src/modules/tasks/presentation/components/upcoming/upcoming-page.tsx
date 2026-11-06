import type { CalendarDate } from '@soonlist/domain'
import { getActiveDayLabel } from '../../../domain/day-label.helper'
import {
	getUpcomingDays,
	getWeekStrip,
} from '../../../domain/upcoming-view.helper'
import { groupTasksByDay } from '../../helpers/task-list.helper'
import { useActiveDay } from '../../hooks/use-active-day'
import { useCompleteTask } from '../../hooks/use-complete-task'
import { useTasksQuery } from '../../hooks/use-tasks-query'
import { DaySection } from '../list/day-section'
import { OverdueSection } from '../list/overdue-section'
import { TaskListError } from '../list/task-list-error'
import { WeekControls } from './week-controls'
import { WeekStrip } from './week-strip'

interface UpcomingPageProps {
	today: CalendarDate
}

export function UpcomingPage({ today }: Readonly<UpcomingPageProps>) {
	const days = getUpcomingDays(today)
	const { activeDay, headerRef, sectionRef, scrollToDay } = useActiveDay(today)
	const strip = getWeekStrip(today, activeDay)
	const activeIndex = days.indexOf(activeDay)
	const previousDay = days[activeIndex - 1]
	const nextDay = days[activeIndex + 1]
	const { data, isPending, isError, refetch } = useTasksQuery({
		from: today,
		to: days.at(-1) ?? today,
		today,
	})
	const { completeTask } = useCompleteTask()
	const tasksByDay = groupTasksByDay(data?.scheduled ?? [])

	// Room below the last day so it can scroll up under the sticky header, which is at least 6rem tall.
	return (
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
							onNext={nextDay && (() => scrollToDay(nextDay))}
							onPrevious={previousDay && (() => scrollToDay(previousDay))}
							onToday={() => scrollToDay(today)}
						/>
					</div>
				</div>

				<WeekStrip days={strip.days} onSelect={scrollToDay} />
			</header>

			{isError && <TaskListError onRetry={() => void refetch()} />}

			<OverdueSection
				isLoading={isPending}
				onComplete={completeTask}
				tasks={data?.overdue ?? []}
				today={today}
			/>

			{days.map(date => (
				<DaySection
					date={date}
					isLoading={isPending}
					key={date}
					onComplete={completeTask}
					ref={sectionRef(date)}
					tasks={tasksByDay.get(date) ?? []}
					today={today}
				/>
			))}
		</main>
	)
}
