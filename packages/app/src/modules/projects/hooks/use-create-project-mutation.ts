import { useMutation, useQueryClient } from '@tanstack/react-query'
import { orpcQuery } from '../../../rpc-query.client'

export function useCreateProjectMutation() {
	const queryClient = useQueryClient()

	return useMutation(
		orpcQuery.projects.create.mutationOptions({
			onSuccess: async () =>
				await queryClient.invalidateQueries({
					queryKey: orpcQuery.projects.list.key(),
				}),
		})
	)
}
