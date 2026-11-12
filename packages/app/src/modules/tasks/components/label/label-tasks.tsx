import type { Label } from '@soonlane/contracts'
import type { CalendarDate } from '@soonlane/domain'
import { useState } from 'react'
import { groupTasksByDay } from '../../helpers/task-list.helper'
import { useCompleteTask } from '../../hooks/use-complete-task'
import { useLabelTasksQuery } from '../../hooks/use-label-tasks-query'
import { useOpenEditor } from '../../hooks/use-open-editor'
import { TaskComposer } from '../composer/task-composer'
import { AddTaskRow } from '../list/add-task-row'
import { DaySection } from '../list/day-section'
import { OverdueSection } from '../list/overdue-section'
import { TaskListError } from '../list/task-list-error'
import { TaskListSkeleton } from '../list/task-list.skeleton'
import { UndatedSection } from '../list/undated-section'

interface LabelTasksProps {
	label: Label
	today: CalendarDate
}

export function LabelTasks({ label, today }: Readonly<LabelTasksProps>) {
	const { openEditorId, setOpenEditorId } = useOpenEditor()
	const isAdding = openEditorId === label.id
	const [shouldFocusAddTask, setShouldFocusAddTask] = useState(false)

	function openComposer() {
		setOpenEditorId(label.id)
		setShouldFocusAddTask(false)
	}

	function closeComposer() {
		setOpenEditorId(undefined)
		setShouldFocusAddTask(true)
	}
	const { data, isPending, isError, refetch } = useLabelTasksQuery({
		labelId: label.id,
		today,
	})
	const { completeTask } = useCompleteTask(today)

	if (isPending) return <TaskListSkeleton />

	const undated = data?.undated ?? []
	const overdue = data?.overdue ?? []
	const tasksByDay = groupTasksByDay(data?.scheduled ?? [])

	return (
		<main className="mx-auto w-full max-w-3xl px-6 pb-24 md:px-10">
			<header className="pt-1 md:pt-4">
				<h1 className="ph-mask text-xl font-bold">{label.name}</h1>
			</header>

			{isError && <TaskListError onRetry={() => void refetch()} />}

			<UndatedSection
				heading="No date"
				onComplete={completeTask}
				tasks={undated}
				today={today}
			/>

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
					date={date}
					hasAddTask={false}
					isLoading={false}
					key={date}
					onComplete={completeTask}
					tasks={tasks}
					today={today}
				/>
			))}

			<div className="pt-4">
				{data &&
					undated.length === 0 &&
					overdue.length === 0 &&
					tasksByDay.size === 0 && (
						<p className="pb-2 text-label text-faint-foreground">
							No tasks with this label yet.
						</p>
					)}

				{isAdding ? (
					<TaskComposer
						defaultDueDate={today}
						defaultLabels={[label]}
						onCancel={closeComposer}
						source="label_view"
						today={today}
					/>
				) : (
					<AddTaskRow autoFocus={shouldFocusAddTask} onClick={openComposer} />
				)}
			</div>
		</main>
	)
}
