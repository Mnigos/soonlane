import type { ListTasksOutput, Task } from '@soonlane/contracts'
import type { CalendarDate } from '@soonlane/domain'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { refreshTaskAndLabelLists } from '@/modules/labels/presentation/helpers/label-queries.helper'
import { orpcQuery } from '@/platform/rpc/rpc-query.client'
import {
	announceCompletion,
	getUndoCallbacks,
} from '../helpers/task-completion.helper'
import {
	findTaskPlacement,
	withoutTask,
	withUpdatedTask,
} from '../helpers/task-list.helper'

/** Logs goal progress at once (optimistically); reaching the target completes the task with Undo. */
export function useLogProgress(today: CalendarDate) {
	const queryClient = useQueryClient()
	const listKeys = [
		orpcQuery.tasks.list.key(),
		orpcQuery.tasks.listByLabel.key(),
	]
	const mutationKey = orpcQuery.tasks.logProgress.mutationKey()
	const undoCallbacks = getUndoCallbacks(queryClient, today)
	const uncomplete = useMutation(
		orpcQuery.tasks.uncomplete.mutationOptions(undoCallbacks)
	)
	const unlog = useMutation(
		orpcQuery.tasks.logProgress.mutationOptions(undoCallbacks)
	)

	const { mutate } = useMutation(
		orpcQuery.tasks.logProgress.mutationOptions({
			onMutate: async ({ id, amount }) => {
				await Promise.all(
					listKeys.map(
						async queryKey => await queryClient.cancelQueries({ queryKey })
					)
				)

				for (const queryKey of listKeys)
					queryClient.setQueriesData<ListTasksOutput>({ queryKey }, list => {
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
					})
			},
			// No snapshot to restore: it would drop newer logs; the refetch below brings the server's progress.
			onError: () => toast('Could not log progress. Try again.'),
			// The server decides completion, so racing logs and other devices stay right.
			onSuccess: ({ task, logged, completed }) => {
				if (!completed) return

				announceCompletion(
					{ ...task, dueDate: completed.dueDate },
					today,
					'goal',
					() =>
						task.repeat
							? uncomplete.mutate({ id: task.id, ...completed })
							: unlog.mutate({ id: task.id, amount: -logged, today })
				)
			},
			// A refetch landing while other logs are in flight would roll their progress back; the timeout runs once this log has left pending.
			onSettled: () => {
				setTimeout(() => {
					if (!queryClient.isMutating({ mutationKey }))
						void refreshTaskAndLabelLists(queryClient)
				}, 0)
			},
		})
	)

	return {
		logProgress: (task: Task, amount: number) =>
			mutate({
				id: task.id,
				amount,
				today,
				dueDate: task.repeat ? task.dueDate : undefined,
			}),
	}
}
