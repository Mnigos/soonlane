import type { ListTasksOutput } from '@soonlane/contracts'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { orpcQuery } from '@/platform/rpc/rpc-query.client'
import {
	findTaskPlacement,
	withoutTask,
	withUpdatedTask,
} from '../helpers/task-list.helper'

/** Logs goal progress at once (optimistically); reaching the target completes the task with Undo. */
export function useLogProgress() {
	const queryClient = useQueryClient()
	const listKey = orpcQuery.tasks.list.key()
	const mutationKey = orpcQuery.tasks.logProgress.mutationKey()

	const { mutate } = useMutation(
		orpcQuery.tasks.logProgress.mutationOptions({
			onMutate: async ({ id, amount }) => {
				await queryClient.cancelQueries({ queryKey: listKey })

				queryClient.setQueriesData<ListTasksOutput>(
					{ queryKey: listKey },
					list => {
						const task = list && findTaskPlacement(list, id)?.task

						if (!list || !task?.goal) return list

						const { goal } = task
						const progress = Math.min(
							Math.max(goal.progress + amount, 0),
							goal.target
						)

						return progress >= goal.target
							? withoutTask(list, id)
							: withUpdatedTask(list, { ...task, goal: { ...goal, progress } })
					}
				)
			},
			// No snapshot to restore: it would drop newer logs; the refetch below brings the server's progress.
			onError: () => toast('Could not log progress. Try again.'),
			// The server's applied amount, not the cache, decides completion, so racing logs and other devices stay right.
			onSuccess: ({ task, logged }) => {
				const { goal } = task

				if (
					!goal ||
					goal.progress < goal.target ||
					goal.progress - logged >= goal.target
				)
					return

				toast('Task completed', {
					action: {
						label: 'Undo',
						onClick: () => mutate({ id: task.id, amount: -logged }),
					},
				})
			},
			// A refetch landing while other logs are in flight would roll their progress back.
			onSettled: async () => {
				if (queryClient.isMutating({ mutationKey }) === 1)
					await queryClient.invalidateQueries({ queryKey: listKey })
			},
		})
	)

	return { logProgress: mutate }
}
