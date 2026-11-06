import type { QueryClient } from '@tanstack/react-query'
import { orpcQuery } from '@/platform/rpc/rpc-query.client'

/** Task rows show label names and the sidebar counts open tasks per label, so both lists follow either change. */
export async function refreshTaskAndLabelLists(queryClient: QueryClient) {
	await Promise.all([
		queryClient.invalidateQueries({ queryKey: orpcQuery.tasks.list.key() }),
		queryClient.invalidateQueries({ queryKey: orpcQuery.labels.list.key() }),
	])
}
