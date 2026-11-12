import {
	type CalendarDate,
	formatDayMonth,
	formatWeekday,
} from '@soonlane/domain'
import { getTodayListInput } from '../helpers/dock-badge.helper'
import { useCompleteTask } from '../hooks/use-complete-task'
import { useCompletedTasksQuery } from '../hooks/use-completed-tasks-query'
import { useTasksQuery } from '../hooks/use-tasks-query'
import { CompletedSection } from './list/completed-section'
import { DaySection } from './list/day-section'
import { NoDateSection } from './list/no-date-section'
import { OverdueSection } from './list/overdue-section'
import { TaskListError } from './list/task-list-error'
import { OpenEditorProvider } from './open-editor-provider'

interface TodayPageProps {
	today: CalendarDate
}

export function TodayPage({ today }: Readonly<TodayPageProps>) {
	const { data, isPending, isError, refetch } = useTasksQuery(
		getTodayListInput(today)
	)
	const { completeTask } = useCompleteTask(today)
	const completed = useCompletedTasksQuery(today).data?.tasks ?? []

	return (
		<OpenEditorProvider>
			<main className="mx-auto w-full max-w-3xl px-6 pb-24 md:px-10">
				<header className="flex flex-col pt-1 md:pt-4">
					<h1 className="text-xl font-bold">Today</h1>

					<p className="text-label text-muted-foreground">
						{formatWeekday(today, 'long')}, {formatDayMonth(today)}
					</p>
				</header>

				{isError && <TaskListError onRetry={() => void refetch()} />}

				{completed.length > 0 && (
					<CompletedSection tasks={completed} today={today} />
				)}

				<NoDateSection
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

				<DaySection
					date={today}
					isLoading={isPending}
					onComplete={completeTask}
					tasks={data?.scheduled ?? []}
					today={today}
				/>
			</main>
		</OpenEditorProvider>
	)
}
