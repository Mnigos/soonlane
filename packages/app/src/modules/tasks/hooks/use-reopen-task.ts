import type { Task } from '@soonlane/contracts'
import type { CalendarDate } from '@soonlane/domain'
import {
	useIsMutating,
	useMutation,
	useQueryClient,
} from '@tanstack/react-query'
import { orpcQuery } from '../../../rpc-query.client'
import { getUndoCallbacks } from '../helpers/task-completion.helper'

/** Reopens a completed task from its row; `isCompleting` holds the rows back, since a reopen that lands before a pending completion would be undone by it. */
export function useReopenTask(today: CalendarDate) {
	const queryClient = useQueryClient()
	const isCompleting =
		useIsMutating({ mutationKey: orpcQuery.tasks.complete.mutationKey() }) > 0
	const { mutate } = useMutation(
		orpcQuery.tasks.uncomplete.mutationOptions(
			getUndoCallbacks(queryClient, today, 'reopen')
		)
	)

	return {
		isCompleting,
		reopenTask: ({ id }: Pick<Task, 'id'>) => mutate({ id }),
	}
}
