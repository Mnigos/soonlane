import type { CalendarDate } from '@soonlane/domain'
import { useCompleteTask } from '../../hooks/use-complete-task'
import { useSearchTasksQuery } from '../../hooks/use-search-tasks-query'
import { CompletedTaskList } from '../list/completed-task-list'
import { TaskList } from '../list/task-list'
import { TaskListError } from '../list/task-list-error'

interface SearchResultsProps {
	query: string
	today: CalendarDate
}

export function SearchResults({ query, today }: Readonly<SearchResultsProps>) {
	const { data, isPending, isError, refetch } = useSearchTasksQuery(query)
	const { completeTask } = useCompleteTask(today)
	const tasks = data?.tasks ?? []
	const open = tasks.filter(task => !task.completedAt)
	const completed = tasks.filter(task => task.completedAt)

	return (
		<>
			{isError && <TaskListError onRetry={() => void refetch()} />}

			<div className="pt-4">
				<TaskList
					isLoading={isPending}
					onComplete={completeTask}
					showsDueDay
					tasks={open}
					today={today}
				/>

				{completed.length > 0 && (
					<section aria-labelledby="completed-heading" className="pt-4">
						<h2
							className="border-b pb-2 text-sm font-semibold"
							id="completed-heading"
						>
							Completed
						</h2>

						<CompletedTaskList tasks={completed} today={today} />
					</section>
				)}

				{data && tasks.length === 0 && (
					<p className="pb-2 text-label text-faint-foreground">
						No tasks match.
					</p>
				)}

				{data?.hasMore && (
					<p className="pt-4 pb-2 text-label text-faint-foreground">
						Showing the first 50 tasks. Add a word to narrow the results.
					</p>
				)}
			</div>
		</>
	)
}
