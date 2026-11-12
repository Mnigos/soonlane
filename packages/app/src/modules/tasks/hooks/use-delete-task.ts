import { capture } from '@soonlane/analytics/client'
import type { Task } from '@soonlane/contracts'
import type { CalendarDate } from '@soonlane/domain'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { orpcQuery } from '../../../rpc-query.client'
import { toastFailure } from '../../shell/helpers/maintenance.helper'
import { getTaskEventProperties } from '../helpers/task-event.helper'
import {
	refreshTaskLists,
	removeCachedTask,
	restoreCachedTask,
} from '../helpers/task-list.helper'

/** Deletes a task at once (optimistically); a failure puts it back. */
export function useDeleteTask(today: CalendarDate) {
	const queryClient = useQueryClient()

	const { mutate } = useMutation(
		orpcQuery.tasks.delete.mutationOptions({
			onMutate: async ({ id }) => ({
				removed: await removeCachedTask(queryClient, id),
			}),
			onError: (error, _input, context) => {
				restoreCachedTask(queryClient, context?.removed)
				toastFailure(error, 'Could not delete the task. Try again.')
			},
			onSuccess: (_output, { id }, context) => {
				// Undo on this task's completion toast would fail once it is gone; a failed delete keeps it.
				toast.dismiss(id)

				const deleted = context?.removed[0]?.placement.task

				if (deleted)
					capture('task_deleted', getTaskEventProperties(deleted, today))
			},
			onSettled: async () => await refreshTaskLists(queryClient),
		})
	)

	return { deleteTask: (task: Task) => mutate({ id: task.id }) }
}
