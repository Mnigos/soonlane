import type { ComposerSource } from '@soonlane/analytics'
import { capture } from '@soonlane/analytics/client'
import type { CalendarDate } from '@soonlane/domain'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { orpcQuery } from '../../../rpc-query.client'
import { refreshTaskAndLabelLists } from '../../labels/helpers/label-queries.helper'
import { getTaskEventProperties } from '../helpers/task-event.helper'

/** Tracks the create here, not in mutate's callbacks, which are skipped once the composer closes. */
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
				await refreshTaskAndLabelLists(queryClient)
			},
		})
	)
}
