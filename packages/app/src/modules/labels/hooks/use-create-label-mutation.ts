import { useMutation, useQueryClient } from '@tanstack/react-query'
import { orpcQuery } from '../../../rpc-query.client'

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
