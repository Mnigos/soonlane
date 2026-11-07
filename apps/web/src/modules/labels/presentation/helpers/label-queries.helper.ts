import type { QueryClient } from '@tanstack/react-query'
import { orpcQuery } from '@/platform/rpc/rpc-query.client'

export async function refreshTaskAndLabelLists(queryClient: QueryClient) {
	await Promise.all([
		queryClient.invalidateQueries({ queryKey: orpcQuery.tasks.list.key() }),
		queryClient.invalidateQueries({
			queryKey: orpcQuery.tasks.listByLabel.key(),
		}),
		queryClient.invalidateQueries({ queryKey: orpcQuery.labels.list.key() }),
	])
}
