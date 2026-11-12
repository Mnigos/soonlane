import type { ListTasksOutput, Task } from '@soonlane/contracts'
import type { CalendarDate } from '@soonlane/domain'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { orpcQuery } from '../../../rpc-query.client'
import { refreshTaskAndLabelLists } from '../../labels/helpers/label-queries.helper'
import { toastFailure } from '../../shell/helpers/maintenance.helper'
import {
	announceCompletion,
	getUndoCallbacks,
} from '../helpers/task-completion.helper'
import {
	findTaskPlacement,
	withoutTask,
	withUpdatedTask,
} from '../helpers/task-list.helper'

export function useLogProgress(today: CalendarDate) {
	const queryClient = useQueryClient()
	const listKey = orpcQuery.tasks.list.key()
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
			onError: error =>
				toastFailure(error, 'Could not log progress. Try again.'),
			onSuccess: ({ task, logged, completed }) => {
				if (!completed) return

				// Nothing to unlog when an open task already at its target completes, so Undo just reopens it.
				const undo = () => {
					if (task.repeat) uncomplete.mutate({ id: task.id, ...completed })
					else if (logged === 0) uncomplete.mutate({ id: task.id })
					else unlog.mutate({ id: task.id, amount: -logged, today })
				}

				announceCompletion(
					{ ...task, dueDate: completed.dueDate },
					today,
					'goal',
					undo
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
