import { useMutation, useQueryClient } from '@tanstack/react-query'
import { refreshTaskAndLabelLists } from '@/modules/labels/presentation/helpers/label-queries.helper'
import { orpcQuery } from '@/platform/rpc/rpc-query.client'

export function useCreateTaskMutation() {
	const queryClient = useQueryClient()

	return useMutation(
		orpcQuery.tasks.create.mutationOptions({
			onSuccess: async () => await refreshTaskAndLabelLists(queryClient),
		})
	)
}
