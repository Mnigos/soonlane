import { type CalendarDate, getDayHeading, getToday } from '@soonlane/domain'
import { Button } from '@soonlane/ui/components/button'
import { groupTasksByDay } from '../../helpers/task-list.helper'
import { useCompletedHistoryQuery } from '../../hooks/use-completed-history-query'
import { CompletedTaskList } from '../list/completed-task-list'
import { TaskListError } from '../list/task-list-error'
import { TaskListSkeleton } from '../list/task-list.skeleton'

interface CompletedPageProps {
	today: CalendarDate
}

export function CompletedPage({ today }: Readonly<CompletedPageProps>) {
	const {
		data,
		isPending,
		isError,
		isFetchNextPageError,
		refetch,
		hasNextPage,
		fetchNextPage,
		isFetchingNextPage,
	} = useCompletedHistoryQuery(today)

	if (isPending) return <TaskListSkeleton />

	const tasks = data?.pages.flatMap(page => page.tasks) ?? []
	const tasksByDay = groupTasksByDay(tasks, ({ completedAt }) =>
		completedAt ? getToday(completedAt) : today
	)

	return (
		<main className="mx-auto w-full max-w-3xl px-6 pb-24 md:px-10">
			<header className="pt-1 md:pt-4">
				<h1 className="text-xl font-bold">Completed</h1>
			</header>

			{isError && !isFetchNextPageError && (
				<TaskListError onRetry={() => void refetch()} />
			)}

			{[...tasksByDay].map(([date, dayTasks]) => (
				<section
					aria-labelledby={`completed-${date}-heading`}
					className="pt-6"
					key={date}
				>
					<h2
						className="border-b pb-2 text-sm font-semibold text-muted-foreground"
						id={`completed-${date}-heading`}
					>
						{getDayHeading(date, today)}
					</h2>

					<CompletedTaskList tasks={dayTasks} today={today} />
				</section>
			))}

			{data && tasks.length === 0 && (
				<p className="pt-4 pb-2 text-label text-faint-foreground">
					No completed tasks yet.
				</p>
			)}

			{isFetchNextPageError && (
				<TaskListError onRetry={() => void fetchNextPage()} />
			)}

			{hasNextPage && !isFetchNextPageError && (
				<Button
					className="mt-4"
					disabled={isFetchingNextPage}
					onClick={() => void fetchNextPage()}
					size="sm"
					variant="outline"
				>
					{isFetchingNextPage ? 'Loading…' : 'Load earlier'}
				</Button>
			)}
		</main>
	)
}
