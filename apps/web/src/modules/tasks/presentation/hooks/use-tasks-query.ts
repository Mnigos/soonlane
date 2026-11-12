import { orpcQuery } from '@soonlane/app/rpc-query'
import type { ListTasksInput } from '@soonlane/contracts'
import { useQuery } from '@tanstack/react-query'

export function useTasksQuery(input: ListTasksInput) {
	return useQuery(orpcQuery.tasks.list.queryOptions({ input }))
}
