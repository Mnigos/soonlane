import { isDefinedError } from '@orpc/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { orpcQuery } from '../../../rpc-query.client'
import { refreshTaskLists } from '../../tasks/helpers/task-list.helper'

export function useUpdateProjectMutation() {
	const queryClient = useQueryClient()

	return useMutation(
		orpcQuery.projects.update.mutationOptions({
			onError: error => {
				if (isDefinedError(error) && error.code === 'NOT_FOUND')
					toast(error.message)
			},
			onSettled: async () => await refreshTaskLists(queryClient),
		})
	)
}
