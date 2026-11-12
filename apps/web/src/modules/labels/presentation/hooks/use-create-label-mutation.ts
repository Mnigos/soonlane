import { orpcQuery } from '@soonlane/app/rpc-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useCreateLabelMutation() {
	const queryClient = useQueryClient()

	return useMutation(
		orpcQuery.labels.create.mutationOptions({
			onSuccess: async () =>
				await queryClient.invalidateQueries({
					queryKey: orpcQuery.labels.list.key(),
				}),
		})
	)
}
