import { isDefinedError } from '@orpc/client'
import type { ComposerSource } from '@soonlane/analytics'
import type { CalendarDate } from '@soonlane/domain'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getHostPorts } from '../../../host-ports.client'
import { orpcQuery } from '../../../rpc-query.client'
import { getTaskEventProperties } from '../helpers/task-event.helper'
import { refreshTaskLists } from '../helpers/task-list.helper'

/**
 * Tracks the create here, not in mutate's callbacks, which are skipped once the composer closes. A NOT_FOUND means the project or the
 * parent task was deleted elsewhere, a CONFLICT that the parent cannot take the subtask: the refresh can take the view or the parent's
 * row, and the composer with it, away, so the server's message goes to a toast.
 */
export function useCreateTaskMutation(
	source: ComposerSource,
	today: CalendarDate
) {
	const queryClient = useQueryClient()
	const { capture, showToast } = getHostPorts()

	return useMutation(
		orpcQuery.tasks.create.mutationOptions({
			onSuccess: async ({ task }) => {
				const properties = getTaskEventProperties(task, today)

				capture('task_created', {
					...properties,
					source,
					hasDescription: task.description !== undefined,
					hasTime: task.dueTime !== undefined,
					hasDuration: task.durationMinutes !== undefined,
					isOverdue: (properties.dueInDays ?? 0) < 0,
				})
				await refreshTaskLists(queryClient)
			},
			onError: async error => {
				if (
					!isDefinedError(error) ||
					(error.code !== 'NOT_FOUND' && error.code !== 'CONFLICT')
				)
					return

				showToast(error.message)
				await refreshTaskLists(queryClient)
			},
		})
	)
}
