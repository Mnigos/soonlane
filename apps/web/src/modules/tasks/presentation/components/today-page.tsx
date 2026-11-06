import type { CalendarDate } from '@soonlist/domain'
import {
	formatDayMonth,
	formatWeekday,
} from '../../domain/calendar-date.helper'
import { useCompleteTask } from '../hooks/use-complete-task'
import { useTasksQuery } from '../hooks/use-tasks-query'
import { DaySection } from './list/day-section'
import { OverdueSection } from './list/overdue-section'
import { TaskListError } from './list/task-list-error'

interface TodayPageProps {
	today: CalendarDate
}

export function TodayPage({ today }: Readonly<TodayPageProps>) {
	const { data, isPending, isError, refetch } = useTasksQuery({
		from: today,
		to: today,
		today,
	})
	const { completeTask } = useCompleteTask()

	return (
		<main className="mx-auto w-full max-w-3xl px-6 pb-24 md:px-10">
			<header className="flex flex-col pt-1 md:pt-4">
				<h1 className="text-xl font-bold">Today</h1>

				<p className="text-label text-muted-foreground">
					{formatWeekday(today, 'long')}, {formatDayMonth(today)}
				</p>
			</header>

			{isError && <TaskListError onRetry={() => void refetch()} />}

			<OverdueSection
				isLoading={isPending}
				onComplete={completeTask}
				tasks={data?.overdue ?? []}
			/>

			<DaySection
				date={today}
				isLoading={isPending}
				onComplete={completeTask}
				tasks={data?.scheduled ?? []}
				today={today}
			/>
		</main>
	)
}
