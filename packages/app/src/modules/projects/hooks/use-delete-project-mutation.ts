import { isDefinedError } from '@orpc/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getHostPorts } from '../../../host-ports.client'
import { orpcQuery } from '../../../rpc-query.client'
import { refreshTaskLists } from '../../tasks/helpers/task-list.helper'

export function useDeleteProjectMutation(onDeleted: () => void) {
	const queryClient = useQueryClient()
	const { showToast } = getHostPorts()

	return useMutation(
		orpcQuery.projects.delete.mutationOptions({
			onSuccess: onDeleted,
			onError: error =>
				showToast(
					isDefinedError(error)
						? error.message
						: 'Could not delete the project. Try again.'
				),
			onSettled: async () => await refreshTaskLists(queryClient),
		})
	)
}
