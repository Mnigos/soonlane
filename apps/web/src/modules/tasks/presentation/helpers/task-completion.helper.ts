import type { Task } from '@soonlane/contracts'
import type { CalendarDate } from '@soonlane/domain'
import type { QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { ClientEvents } from '@/modules/analytics/domain/analytics-event.types'
import { capture } from '@/modules/analytics/presentation/analytics.client'
import { refreshTaskAndLabelLists } from '@/modules/labels/presentation/helpers/label-queries.helper'
import { getTaskEventProperties } from './task-event.helper'

/** Reports the completed occurrence and offers Undo in the "Task completed" toast. */
export function announceCompletion(
	completed: Task,
	today: CalendarDate,
	completedVia: ClientEvents['task_completed']['completed_via'],
	undo: () => void
) {
	const properties = getTaskEventProperties(completed, today)

	capture('task_completed', {
		...properties,
		was_overdue: properties.due_in_days < 0,
		completed_via: completedVia,
	})
	toast('Task completed', {
		// A newer completion of this task replaces the toast, so an older Undo cannot revert it.
		id: completed.id,
		action: { label: 'Undo', onClick: undo },
	})
}

/** Callbacks for the mutation behind Undo, whichever procedure restores the task. */
export function getUndoCallbacks(
	queryClient: QueryClient,
	today: CalendarDate
) {
	return {
		onError: (_error: unknown, { id }: { id: string }) => {
			capture('task_completion_failed', { task_id: id, action: 'uncomplete' })
			toast('Could not restore the task. Try again.')
		},
		onSuccess: ({ task }: { task: Task }) => {
			const properties = getTaskEventProperties(task, today)

			capture('task_uncompleted', {
				...properties,
				was_overdue: properties.due_in_days < 0,
				completed_via: 'undo',
			})
		},
		onSettled: async () => await refreshTaskAndLabelLists(queryClient),
	}
}
