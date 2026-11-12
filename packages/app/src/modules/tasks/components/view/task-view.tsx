import type { ListTasksInput } from '@soonlane/contracts'
import type { CalendarDate } from '@soonlane/domain'
import type { QueryKey } from '@tanstack/react-query'
import { type ComponentProps, useState } from 'react'
import { groupTasksByDay } from '../../helpers/task-list.helper'
import { useCompleteTask } from '../../hooks/use-complete-task'
import { useOpenEditor } from '../../hooks/use-open-editor'
import { useViewTasksQuery } from '../../hooks/use-view-tasks-query'
import { TaskComposer } from '../composer/task-composer'
import { AddTaskRow } from '../list/add-task-row'
import { DaySection } from '../list/day-section'
import { OverdueSection } from '../list/overdue-section'
import { TaskListError } from '../list/task-list-error'
import { TaskListSkeleton } from '../list/task-list.skeleton'
import { UndatedSection } from '../list/undated-section'

interface TaskViewProps {
	/** The label's id, which also names the view's composer among the page's open editors. */
	id: string
	name: string
	today: CalendarDate
	filter: Pick<ListTasksInput, 'labelId'>
	ownerListKey: QueryKey
	emptyNote: string
	composer: Pick<
		ComponentProps<typeof TaskComposer>,
		'defaultLabels' | 'source'
	>
}

/** A label's open tasks: No date, Overdue, one section per day, and one Add task row at the bottom. */
export function TaskView({
	id,
	name,
	today,
	filter,
	ownerListKey,
	emptyNote,
	composer,
}: Readonly<TaskViewProps>) {
	const { openEditorId, setOpenEditorId } = useOpenEditor()
	const isAdding = openEditorId === id
	const [shouldFocusAddTask, setShouldFocusAddTask] = useState(false)

	function openComposer() {
		setOpenEditorId(id)
		setShouldFocusAddTask(false)
	}

	function closeComposer() {
		setOpenEditorId(undefined)
		setShouldFocusAddTask(true)
	}
	const { data, isPending, isError, refetch } = useViewTasksQuery(
		{ ...filter, today },
		ownerListKey
	)
	const { completeTask } = useCompleteTask(today)

	if (isPending) return <TaskListSkeleton />

	const undated = data?.undated ?? []
	const overdue = data?.overdue ?? []
	const tasksByDay = groupTasksByDay(data?.scheduled ?? [])

	return (
		<main className="mx-auto w-full max-w-3xl px-6 pb-24 md:px-10">
			<header className="pt-1 md:pt-4">
				<h1 className="ph-mask text-xl font-bold">{name}</h1>
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
						<p className="pb-2 text-label text-faint-foreground">{emptyNote}</p>
					)}

				{isAdding ? (
					<TaskComposer
						{...composer}
						defaultDueDate={today}
						onCancel={closeComposer}
						today={today}
					/>
				) : (
					<AddTaskRow autoFocus={shouldFocusAddTask} onClick={openComposer} />
				)}
			</div>
		</main>
	)
}
