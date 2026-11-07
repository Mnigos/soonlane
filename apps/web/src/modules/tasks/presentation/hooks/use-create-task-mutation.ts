import type { CalendarDate } from '@soonlane/domain'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ComposerSource } from '@/modules/analytics/domain/analytics-event.types'
import { capture } from '@/modules/analytics/presentation/analytics.client'
import { refreshTaskAndLabelLists } from '@/modules/labels/presentation/helpers/label-queries.helper'
import { orpcQuery } from '@/platform/rpc/rpc-query.client'
import { getTaskEventProperties } from '../helpers/task-event.helper'

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
