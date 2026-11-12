import type { ComposerSource } from '@soonlane/analytics'
import { capture } from '@soonlane/analytics/client'
import { refreshTaskAndLabelLists } from '@soonlane/app/labels/helpers/label-queries.helper'
import { orpcQuery } from '@soonlane/app/rpc-query'
import type { CalendarDate } from '@soonlane/domain'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
					has_description: task.description !== undefined,
					has_time: task.dueTime !== undefined,
					is_overdue: properties.due_in_days < 0,
				})
				await refreshTaskAndLabelLists(queryClient)
			},
		})
	)
}
