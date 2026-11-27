import type { ListTasksOutput, Task } from '@soonlane/contracts'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { orpcQuery } from '../../../rpc-query.client'
import {
	refreshTaskLists,
	withUpdatedTask,
} from '../../tasks/helpers/task-list.helper'

interface PinOutput {
	task: Task
}

/** Pin and unpin a task's Linear issues; each answer is the task, written into the open lists and its `tasks.get` entry at once. */
export function useLinearPinMutations() {
	const queryClient = useQueryClient()
	const callbacks = {
		onSuccess: ({ task }: PinOutput) => {
			queryClient.setQueriesData<ListTasksOutput>(
				{ queryKey: orpcQuery.tasks.list.key() },
				list => list && withUpdatedTask(list, task)
			)
			queryClient.setQueryData(
				orpcQuery.tasks.get.queryKey({ input: { id: task.id } }),
				{ task }
			)
		},
		onSettled: async () => await refreshTaskLists(queryClient),
	}

	return {
		pin: useMutation(orpcQuery.linear.pin.mutationOptions(callbacks)),
		unpin: useMutation(orpcQuery.linear.unpin.mutationOptions(callbacks)),
	}
}
