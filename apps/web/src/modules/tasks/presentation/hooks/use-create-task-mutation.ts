import { useMutation, useQueryClient } from '@tanstack/react-query'
import { orpcQuery } from '@/platform/rpc/rpc-query.client'

export function useCreateTaskMutation() {
	const queryClient = useQueryClient()

	return useMutation(
		orpcQuery.tasks.create.mutationOptions({
			onSuccess: async () =>
				await queryClient.invalidateQueries({
					queryKey: orpcQuery.tasks.list.key(),
				}),
		})
	)
}
