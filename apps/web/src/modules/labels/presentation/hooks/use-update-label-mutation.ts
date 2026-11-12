import { isDefinedError } from '@orpc/client'
import { orpcQuery } from '@soonlane/app/rpc-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { refreshTaskAndLabelLists } from '../helpers/label-queries.helper'

export function useUpdateLabelMutation() {
	const queryClient = useQueryClient()

	return useMutation(
		orpcQuery.labels.update.mutationOptions({
			onError: error => {
				if (isDefinedError(error) && error.code === 'NOT_FOUND')
					toast(error.message)
			},
			onSettled: async () => await refreshTaskAndLabelLists(queryClient),
		})
	)
}
