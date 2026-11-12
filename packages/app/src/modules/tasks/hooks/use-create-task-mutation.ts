import { isDefinedError } from '@orpc/client'
import type { ComposerSource } from '@soonlane/analytics'
import { capture } from '@soonlane/analytics/client'
import type { CalendarDate } from '@soonlane/domain'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { orpcQuery } from '../../../rpc-query.client'
import { getTaskEventProperties } from '../helpers/task-event.helper'
import { refreshTaskLists } from '../helpers/task-list.helper'

/** Tracks the create here, not in mutate's callbacks, which are skipped once the composer closes. A NOT_FOUND means the project was deleted elsewhere: the refresh turns its view into not-found and unmounts the composer, so the message goes to a toast. */
export function useCreateTaskMutation(
	source: ComposerSource,
	today: CalendarDate
) {
	const queryClient = useQueryClient()

	return useMutation(
		orpcQuery.tasks.create.mutationOptions({
			onSuccess: async ({ task }) => {
				const properties = getTaskEventProperties(task, today)

				capture('task_created', {
					...properties,
					source,
					hasDescription: task.description !== undefined,
					hasTime: task.dueTime !== undefined,
					isOverdue: (properties.dueInDays ?? 0) < 0,
				})
				await refreshTaskLists(queryClient)
			},
			onError: async error => {
				if (!(isDefinedError(error) && error.code === 'NOT_FOUND')) return

				toast(error.message)
				await refreshTaskLists(queryClient)
			},
		})
	)
}
