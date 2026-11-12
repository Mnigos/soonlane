import { capture } from '@soonlane/analytics/client'
import { orpcQuery } from '@soonlane/app/rpc-query'
import { completeTaskInputSchema, type Task } from '@soonlane/contracts'
import type { CalendarDate } from '@soonlane/domain'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { refreshTaskAndLabelLists } from '@/modules/labels/presentation/helpers/label-queries.helper'
import { toastFailure } from '@/modules/shell/presentation/helpers/maintenance.helper'
import {
	addToCompleted,
	announceCompletion,
	getUndoCallbacks,
	removeFromCompleted,
} from '../helpers/task-completion.helper'
import {
	removeCachedTask,
	restoreCachedTask,
} from '../helpers/task-list.helper'

/** The goal progress each task showed when completed, for Undo; a search result is in no cached list to read it from. */
const seenProgress = new Map<string, number | undefined>()

/** Completes a task at once (optimistically) and offers Undo in a toast. */
export function useCompleteTask(today: CalendarDate) {
	const queryClient = useQueryClient()

	async function refreshLists() {
		await refreshTaskAndLabelLists(queryClient)
	}

	const uncomplete = useMutation(
		orpcQuery.tasks.uncomplete.mutationOptions(
			getUndoCallbacks(queryClient, today)
		)
	)

	const complete = useMutation(
		orpcQuery.tasks.complete.mutationOptions({
			onMutate: async ({ id }) => {
				await queryClient.cancelQueries({
					queryKey: orpcQuery.tasks.listCompleted.key(),
				})
				const removed = await removeCachedTask(queryClient, id)
				const completed = removed[0]?.placement.task

				if (completed && !completed.repeat)
					addToCompleted(queryClient, completed)

				return { removed }
			},
			onError: (error, { id }, context) => {
				removeFromCompleted(queryClient, id)
				restoreCachedTask(queryClient, context?.removed)
				capture('task_completion_failed', { task_id: id, action: 'complete' })
				toastFailure(error, 'Could not complete the task. Try again.')
			},
			onSuccess: ({ task }, input) => {
				const { dueDate: seenDueDate } = completeTaskInputSchema.parse(input)
				// A repeating task moved on; Undo puts back the due date and goal progress it had before.
				const restored = task.repeat && {
					dueDate: seenDueDate,
					progress: seenProgress.get(task.id),
				}

				announceCompletion(
					{ ...task, dueDate: seenDueDate ?? task.dueDate },
					today,
					'circle',
					() => uncomplete.mutate({ id: task.id, ...restored })
				)
			},
			onSettled: refreshLists,
		})
	)

	return {
		completeTask: (task: Task) => {
			seenProgress.set(task.id, task.goal?.progress)
			complete.mutate({
				id: task.id,
				today,
				dueDate: task.repeat ? task.dueDate : undefined,
			})
		},
	}
}
