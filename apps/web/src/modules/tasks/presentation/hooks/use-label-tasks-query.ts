import { ORPCError } from '@orpc/client'
import type { ListTasksByLabelInput } from '@soonlane/contracts'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { orpcQuery } from '@/platform/rpc/rpc-query.client'

export function useLabelTasksQuery(input: ListTasksByLabelInput) {
	const queryClient = useQueryClient()
	const options = orpcQuery.tasks.listByLabel.queryOptions({ input })

	return useQuery({
		...options,
		queryFn: async context => {
			try {
				return await options.queryFn(context)
			} catch (error) {
				// The label was deleted elsewhere: dropping it from the labels list lets the page show not-found while this query is still pending.
				if (error instanceof ORPCError && error.code === 'NOT_FOUND')
					await queryClient.invalidateQueries({
						queryKey: orpcQuery.labels.list.key(),
					})

				throw error
			}
		},
	})
}
