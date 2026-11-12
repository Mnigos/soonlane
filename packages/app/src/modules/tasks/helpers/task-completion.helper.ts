import type { ClientEvents } from '@soonlane/analytics'
import type { ListCompletedTasksOutput, Task } from '@soonlane/contracts'
import {
	type CalendarDate,
	TASK_COMPLETED_ORDER,
	type TaskCompletedOrderKey,
} from '@soonlane/domain'
import type { InfiniteData, QueryClient, QueryKey } from '@tanstack/react-query'
import { getHostPorts } from '../../../host-ports.client'
import { orpcQuery } from '../../../rpc-query.client'
import { toastFailure } from '../../shell/helpers/maintenance.helper'
import { getTaskEventProperties } from './task-event.helper'
import { refreshTaskLists } from './task-list.helper'

/** Today's Completed section caches one list; the Completed view caches its pages. */
type CompletedCache =
	| ListCompletedTasksOutput
	| InfiniteData<ListCompletedTasksOutput>

/** The variables a task mutation sends, before the API parses the id. */
interface TaskVariables {
	id: string
}

/** What a task mutation resolves with. */
interface TaskResult {
	task: Task
}

/** The reopened task and the Completed lists that held it, to put it back when the change fails. */
interface ReopenContext {
	reopened?: Task
	queryKeys: QueryKey[]
}

const COMPLETED_ORDER_COMPARATORS: Record<
	TaskCompletedOrderKey,
	(a: Task, b: Task) => number
> = {
	completedAt: (a, b) =>
		(b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0),
	createdAt: (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
}

function compareCompleted(a: Task, b: Task) {
	return TASK_COMPLETED_ORDER.reduce(
		(result, key) => result || COMPLETED_ORDER_COMPARATORS[key](a, b),
		0
	)
}

function getPages(data: CompletedCache) {
	return 'pages' in data ? data.pages : [data]
}

function updatePages(
	data: CompletedCache,
	update: (pages: ListCompletedTasksOutput[]) => ListCompletedTasksOutput[]
) {
	const pages = update(getPages(data))

	return 'pages' in data ? { ...data, pages } : (pages[0] ?? data)
}

function withoutCompleted(pages: ListCompletedTasksOutput[], id: string) {
	return pages.map(page => ({
		...page,
		tasks: page.tasks.filter(task => task.id !== id),
	}))
}

/** Puts a task in its sorted place, in the first page that reaches back to it. */
function withCompleted(data: CompletedCache, completed: Task) {
	return updatePages(data, pages => {
		const kept = withoutCompleted(pages, completed.id)
		const index = kept.findIndex(({ tasks }) => {
			const oldest = tasks.at(-1)

			return oldest !== undefined && compareCompleted(completed, oldest) <= 0
		})
		const target = index === -1 ? kept.length - 1 : index

		return kept.map((page, pageIndex) =>
			pageIndex === target
				? {
						...page,
						tasks: [...page.tasks, completed].toSorted(compareCompleted),
					}
				: page
		)
	})
}

/** Shows a task in every cached Completed list; one without `completedAt` counts as completed now. */
export function addToCompleted(queryClient: QueryClient, task: Task) {
	const completed = { ...task, completedAt: task.completedAt ?? new Date() }

	queryClient.setQueriesData<CompletedCache>(
		{ queryKey: orpcQuery.tasks.listCompleted.key() },
		data => data && withCompleted(data, completed)
	)
}

/** Hides a task from every cached Completed list and returns it with the lists that held it, so a failed change can put it back. */
export function removeFromCompleted(
	queryClient: QueryClient,
	id: string
): ReopenContext {
	const queryKey = orpcQuery.tasks.listCompleted.key()
	const holding = queryClient
		.getQueriesData<CompletedCache>({ queryKey })
		.flatMap(([key, data]) =>
			(data ? getPages(data) : []).flatMap(({ tasks }) =>
				tasks.filter(task => task.id === id).map(task => ({ key, task }))
			)
		)

	queryClient.setQueriesData<CompletedCache>(
		{ queryKey },
		data => data && updatePages(data, pages => withoutCompleted(pages, id))
	)

	return {
		reopened: holding[0]?.task,
		queryKeys: holding.map(({ key }) => key),
	}
}

export function announceCompletion(
	completed: Task,
	today: CalendarDate,
	completedVia: ClientEvents['task_completed']['completedVia'],
	undo: () => void
) {
	const { capture, showToast } = getHostPorts()
	const properties = getTaskEventProperties(completed, today)

	capture('task_completed', {
		...properties,
		wasOverdue: (properties.dueInDays ?? 0) < 0,
		completedVia,
	})
	showToast('Task completed', {
		// A newer completion of this task replaces the toast, so an older Undo cannot revert it.
		id: completed.id,
		action: { label: 'Undo', onClick: undo },
	})
}

/** Reopens a task: Undo in the toast, or its checkbox under Completed. */
export function getUndoCallbacks(
	queryClient: QueryClient,
	today: CalendarDate,
	uncompletedVia: ClientEvents['task_uncompleted']['completedVia'] = 'undo'
) {
	const { capture } = getHostPorts()

	return {
		onMutate: async ({ id }: TaskVariables) => {
			await queryClient.cancelQueries({
				queryKey: orpcQuery.tasks.listCompleted.key(),
			})

			return removeFromCompleted(queryClient, id)
		},
		onError: (
			error: unknown,
			{ id }: TaskVariables,
			context?: ReopenContext
		) => {
			const reopened = context?.reopened

			if (reopened)
				for (const queryKey of context.queryKeys)
					queryClient.setQueryData<CompletedCache>(
						queryKey,
						data => data && withCompleted(data, reopened)
					)
			capture('task_completion_failed', { taskId: id, action: 'uncomplete' })
			toastFailure(error, 'Could not restore the task. Try again.')
		},
		onSuccess: ({ task }: TaskResult) => {
			const properties = getTaskEventProperties(task, today)

			capture('task_uncompleted', {
				...properties,
				wasOverdue: (properties.dueInDays ?? 0) < 0,
				completedVia: uncompletedVia,
			})
		},
		onSettled: async () => await refreshTaskLists(queryClient),
	}
}
