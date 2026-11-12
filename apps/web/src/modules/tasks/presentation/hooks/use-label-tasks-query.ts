import { ORPCError } from '@orpc/client'
import { orpcQuery } from '@soonlane/app/rpc-query'
import type { ListTasksByLabelInput } from '@soonlane/contracts'
import { useQuery, useQueryClient } from '@tanstack/react-query'

export function useLabelTasksQuery(input: ListTasksByLabelInput) {
	const queryClient = useQueryClient()
	const options = orpcQuery.tasks.listByLabel.queryOptions({ input })

	return useQuery({
		...options,
		queryFn: async context => {
			try {
				return await options.queryFn(context)
			} catch (error) {
				// The label was deleted elsewhere: refreshing the labels list lets the page show not-found.
				if (error instanceof ORPCError && error.code === 'NOT_FOUND')
					await queryClient.invalidateQueries({
						queryKey: orpcQuery.labels.list.key(),
					})

				throw error
			}
		},
	})
}
