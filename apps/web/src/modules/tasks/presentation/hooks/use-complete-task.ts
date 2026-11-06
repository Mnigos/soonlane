import type { ListTasksOutput } from '@soonlane/contracts'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { orpcQuery } from '@/platform/rpc/rpc-query.client'
import {
	findTaskPlacement,
	withoutTask,
	withTask,
} from '../helpers/task-list.helper'

/** Completes a task at once (optimistically) and offers Undo in a toast. */
export function useCompleteTask() {
	const queryClient = useQueryClient()
	const listKey = orpcQuery.tasks.list.key()

	async function refreshLists() {
		await queryClient.invalidateQueries({ queryKey: listKey })
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
			onSuccess: ({ task }) => {
				toast('Task completed', {
					action: {
						label: 'Undo',
						onClick: () => uncomplete.mutate({ id: task.id }),
					},
				})
			},
			onSettled: refreshLists,
		})
	)

	return { completeTask: complete.mutate }
}
