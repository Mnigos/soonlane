import { isDefinedError } from '@orpc/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { orpcQuery } from '../../../rpc-query.client'
import { toastFailure } from '../../shell/helpers/maintenance.helper'
import { refreshTaskLists } from '../../tasks/helpers/task-list.helper'

export function useDeleteProjectMutation(onDeleted: () => void) {
	const queryClient = useQueryClient()

	return useMutation(
		orpcQuery.projects.delete.mutationOptions({
			onSuccess: onDeleted,
			onError: error =>
				toastFailure(
					error,
					isDefinedError(error)
						? error.message
						: 'Could not delete the project. Try again.'
				),
			onSettled: async () => await refreshTaskLists(queryClient),
		})
	)
}
