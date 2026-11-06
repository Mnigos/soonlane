import type { ListTasksInput } from '@soonlane/contracts'
import { useQuery } from '@tanstack/react-query'
import { orpcQuery } from '@/platform/rpc/rpc-query.client'

export function useTasksQuery(input: ListTasksInput) {
	return useQuery(orpcQuery.tasks.list.queryOptions({ input }))
}
