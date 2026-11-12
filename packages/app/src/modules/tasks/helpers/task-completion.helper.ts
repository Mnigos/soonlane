import type { ClientEvents } from '@soonlane/analytics'
import { capture } from '@soonlane/analytics/client'
import type { ListCompletedTasksOutput, Task } from '@soonlane/contracts'
import {
	type CalendarDate,
	TASK_COMPLETED_ORDER,
	type TaskCompletedOrderKey,
} from '@soonlane/domain'
import type { QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { orpcQuery } from '../../../rpc-query.client'
import { toastFailure } from '../../shell/helpers/maintenance.helper'
import { getTaskEventProperties } from './task-event.helper'
import { refreshTaskLists } from './task-list.helper'

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

/** Shows a task in every cached Completed list where the server would place it; one without `completedAt` counts as completed now. */
export function addToCompleted(queryClient: QueryClient, task: Task) {
	const completed = { ...task, completedAt: task.completedAt ?? new Date() }

	queryClient.setQueriesData<ListCompletedTasksOutput>(
		{ queryKey: orpcQuery.tasks.listCompleted.key() },
		list =>
			list && {
				tasks: [
					...list.tasks.filter(({ id }) => id !== task.id),
					completed,
				].toSorted(compareCompleted),
			}
	)
}

/** Hides a task from every cached Completed list and returns it, so a failed change can put it back. */
export function removeFromCompleted(queryClient: QueryClient, id: string) {
	const queryKey = orpcQuery.tasks.listCompleted.key()
	const [removed] = queryClient
		.getQueriesData<ListCompletedTasksOutput>({ queryKey })
		.flatMap(([, list]) => list?.tasks.filter(task => task.id === id) ?? [])

	queryClient.setQueriesData<ListCompletedTasksOutput>(
		{ queryKey },
		list => list && { tasks: list.tasks.filter(task => task.id !== id) }
	)

	return removed
}

export function announceCompletion(
	completed: Task,
	today: CalendarDate,
	completedVia: ClientEvents['task_completed']['completedVia'],
	undo: () => void
) {
	const properties = getTaskEventProperties(completed, today)

	capture('task_completed', {
		...properties,
		wasOverdue: (properties.dueInDays ?? 0) < 0,
		completedVia,
	})
	toast('Task completed', {
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
	return {
		onMutate: async ({ id }: { id: string }) => {
			await queryClient.cancelQueries({
				queryKey: orpcQuery.tasks.listCompleted.key(),
			})

			return { reopened: removeFromCompleted(queryClient, id) }
		},
		onError: (
			error: unknown,
			{ id }: { id: string },
			context?: { reopened?: Task }
		) => {
			if (context?.reopened) addToCompleted(queryClient, context.reopened)
			capture('task_completion_failed', { taskId: id, action: 'uncomplete' })
			toastFailure(error, 'Could not restore the task. Try again.')
		},
		onSuccess: ({ task }: { task: Task }) => {
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
