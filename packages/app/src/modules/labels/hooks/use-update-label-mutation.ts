import { isDefinedError } from '@orpc/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getHostPorts } from '../../../host-ports.client'
import { orpcQuery } from '../../../rpc-query.client'
import { refreshTaskLists } from '../../tasks/helpers/task-list.helper'

export function useUpdateLabelMutation() {
	const queryClient = useQueryClient()
	const { showToast } = getHostPorts()

	return useMutation(
		orpcQuery.labels.update.mutationOptions({
			onError: error => {
				if (isDefinedError(error) && error.code === 'NOT_FOUND')
					showToast(error.message)
			},
			onSettled: async () => await refreshTaskLists(queryClient),
		})
	)
}
