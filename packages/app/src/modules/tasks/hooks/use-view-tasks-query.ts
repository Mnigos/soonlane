import { ORPCError } from '@orpc/client'
import type { ListTasksInput } from '@soonlane/contracts'
import { type QueryKey, useQuery, useQueryClient } from '@tanstack/react-query'
import { orpcQuery } from '../../../rpc-query.client'

/** A view's tasks; NOT_FOUND means its label was deleted elsewhere, so refreshing `ownerListKey` lets the page show not-found. */
export function useViewTasksQuery(
	input: ListTasksInput,
	ownerListKey: QueryKey
) {
	const queryClient = useQueryClient()
	const options = orpcQuery.tasks.list.queryOptions({ input })

	return useQuery({
		...options,
		queryFn: async context => {
			try {
				return await options.queryFn(context)
			} catch (error) {
				if (error instanceof ORPCError && error.code === 'NOT_FOUND')
					await queryClient.invalidateQueries({ queryKey: ownerListKey })

				throw error
			}
		},
	})
}
