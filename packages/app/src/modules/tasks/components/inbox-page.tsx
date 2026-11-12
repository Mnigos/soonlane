import type { CalendarDate } from '@soonlane/domain'
import { useState } from 'react'
import { getTodayListInput } from '../helpers/dock-badge.helper'
import { useCompleteTask } from '../hooks/use-complete-task'
import { useOpenEditor } from '../hooks/use-open-editor'
import { useTasksQuery } from '../hooks/use-tasks-query'
import { TaskComposer } from './composer/task-composer'
import { AddTaskRow } from './list/add-task-row'
import { TaskList } from './list/task-list'
import { TaskListError } from './list/task-list-error'
import { OpenEditorProvider } from './open-editor-provider'

interface InboxPageProps {
	today: CalendarDate
}

const COMPOSER_ID = 'inbox'

export function InboxPage({ today }: Readonly<InboxPageProps>) {
	return (
		<OpenEditorProvider>
			<InboxTasks today={today} />
		</OpenEditorProvider>
	)
}

/** Reads Today's list, which carries the Inbox, so both views share one cache entry and its optimistic updates. */
function InboxTasks({ today }: Readonly<InboxPageProps>) {
	const { openEditorId, setOpenEditorId } = useOpenEditor()
	const isAdding = openEditorId === COMPOSER_ID
	const [shouldFocusAddTask, setShouldFocusAddTask] = useState(false)
	const { data, isPending, isError, refetch } = useTasksQuery(
		getTodayListInput(today)
	)
	const { completeTask } = useCompleteTask(today)
	const tasks = data?.undated ?? []

	function openComposer() {
		setOpenEditorId(COMPOSER_ID)
		setShouldFocusAddTask(false)
	}

	function closeComposer() {
		setOpenEditorId(undefined)
		setShouldFocusAddTask(true)
	}

	return (
		<main className="mx-auto w-full max-w-3xl px-6 pb-24 md:px-10">
			<header className="pt-1 md:pt-4">
				<h1 className="text-xl font-bold">Inbox</h1>
			</header>

			{isError && <TaskListError onRetry={() => void refetch()} />}

			<div className="pt-4">
				<TaskList
					isLoading={isPending}
					onComplete={completeTask}
					tasks={tasks}
					today={today}
				/>

				{data && tasks.length === 0 && (
					<p className="pb-2 text-label text-faint-foreground">
						Nothing in the Inbox.
					</p>
				)}

				{isAdding ? (
					<TaskComposer
						defaultDueDate={undefined}
						onCancel={closeComposer}
						source="inbox_view"
						today={today}
					/>
				) : (
					<AddTaskRow autoFocus={shouldFocusAddTask} onClick={openComposer} />
				)}
			</div>
		</main>
	)
}
