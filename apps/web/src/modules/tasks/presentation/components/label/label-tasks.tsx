import type { Label } from '@soonlane/contracts'
import { type CalendarDate, toCalendarDate } from '@soonlane/domain'
import { useState } from 'react'
import { groupTasksByDay } from '../../helpers/task-list.helper'
import { useCompleteTask } from '../../hooks/use-complete-task'
import { useLabelTasksQuery } from '../../hooks/use-label-tasks-query'
import { TaskComposer } from '../composer/task-composer'
import { AddTaskRow } from '../list/add-task-row'
import { DaySection } from '../list/day-section'
import { OverdueSection } from '../list/overdue-section'
import { TaskListError } from '../list/task-list-error'
import { TaskListSkeleton } from '../list/task-list.skeleton'

interface LabelTasksProps {
	label: Label
	today: CalendarDate
}

export function LabelTasks({ label, today }: Readonly<LabelTasksProps>) {
	const [isAdding, setIsAdding] = useState(false)
	const { data, isPending, isError, refetch } = useLabelTasksQuery({
		labelId: label.id,
		today,
	})
	const { completeTask } = useCompleteTask(today)

	if (isPending) return <TaskListSkeleton />

	const overdue = data?.overdue ?? []
	const tasksByDay = groupTasksByDay(data?.scheduled ?? [])

	return (
		<main className="mx-auto w-full max-w-3xl px-6 pb-24 md:px-10">
			<header className="pt-1 md:pt-4">
				<h1 className="text-xl font-bold">{label.name}</h1>
			</header>

			{isError && <TaskListError onRetry={() => void refetch()} />}

			{overdue.length > 0 && (
				<OverdueSection
					isLoading={false}
					onComplete={completeTask}
					tasks={overdue}
					today={today}
				/>
			)}

			{[...tasksByDay].map(([date, tasks]) => (
				<DaySection
					date={toCalendarDate(date)}
					hasAddTask={false}
					isLoading={false}
					key={date}
					onComplete={completeTask}
					tasks={tasks}
					today={today}
				/>
			))}

			<div className="pt-4">
				{data && overdue.length === 0 && tasksByDay.size === 0 && (
					<p className="pb-2 text-label text-faint-foreground">
						No tasks with this label yet.
					</p>
				)}

				{isAdding ? (
					<TaskComposer
						defaultDueDate={today}
						defaultLabels={[label]}
						onCancel={() => setIsAdding(false)}
						today={today}
					/>
				) : (
					<AddTaskRow onClick={() => setIsAdding(true)} />
				)}
			</div>
		</main>
	)
}
