import type { ListTasksOutput, Task } from '@soonlane/contracts'
import type { CalendarDate } from '@soonlane/domain'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { refreshTaskAndLabelLists } from '@/modules/labels/presentation/helpers/label-queries.helper'
import { orpcQuery } from '@/platform/rpc/rpc-query.client'
import {
	findTaskPlacement,
	withoutTask,
	withTask,
} from '../helpers/task-list.helper'

/** Completes a task at once (optimistically) and offers Undo in a toast. */
export function useCompleteTask(today: CalendarDate) {
	const queryClient = useQueryClient()
	const listKey = orpcQuery.tasks.key({ type: 'query' })

	async function refreshLists() {
		await refreshTaskAndLabelLists(queryClient)
	}

	const uncomplete = useMutation(
		orpcQuery.tasks.uncomplete.mutationOptions({
			onError: () => toast('Could not restore the task. Try again.'),
			onSettled: refreshLists,
		})
	)

	const complete = useMutation(
		orpcQuery.tasks.complete.mutationOptions({
			onMutate: async ({ id }) => {
				await queryClient.cancelQueries({ queryKey: listKey })
				const removed = queryClient
					.getQueriesData<ListTasksOutput>({ queryKey: listKey })
					.flatMap(([key, list]) => {
						const placement = list && findTaskPlacement(list, id)

						return placement ? [{ key, placement }] : []
					})

				queryClient.setQueriesData<ListTasksOutput>(
					{ queryKey: listKey },
					list => list && withoutTask(list, id)
				)

				return { removed }
			},
			// Puts back only this task, so a concurrent completion's removal survives.
			onError: (_error, _input, context) => {
				for (const { key, placement } of context?.removed ?? [])
					queryClient.setQueryData<ListTasksOutput>(
						key,
						list => list && withTask(list, placement)
					)
				toast('Could not complete the task. Try again.')
			},
			onSuccess: ({ task }, input) => {
				// A repeating task moved on; Undo puts back the due date it had before.
				const dueDate = task.repeat ? input.dueDate : undefined

				toast('Task completed', {
					// A newer completion of this task replaces the toast, so an older Undo cannot revert it.
					id: task.id,
					action: {
						label: 'Undo',
						onClick: () => uncomplete.mutate({ id: task.id, dueDate }),
					},
				})
			},
			onSettled: refreshLists,
		})
	)

	return {
		completeTask: (task: Task) =>
			complete.mutate({
				id: task.id,
				today,
				dueDate: task.repeat ? task.dueDate : undefined,
			}),
	}
}
