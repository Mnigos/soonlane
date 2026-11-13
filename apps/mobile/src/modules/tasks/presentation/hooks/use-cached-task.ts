import { orpcQuery } from '@soonlane/app/rpc-query'
import { findTaskPlacement } from '@soonlane/app/tasks/helpers/task-list.helper'
import type { ListTasksOutput } from '@soonlane/contracts'
import { useQueryClient } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'

/** A task as the most recently written cached list holds it, so every optimistic change shows; undefined once no list holds it. */
export function useCachedTask(id: string) {
	const queryClient = useQueryClient()

	return useSyncExternalStore(
		queryClient.getQueryCache().subscribe,
		() =>
			queryClient
				.getQueriesData<ListTasksOutput>({
					queryKey: orpcQuery.tasks.list.key(),
				})
				.flatMap(([key, list]) => {
					const placement = list && findTaskPlacement(list, id)

					return placement
						? [
								{
									task: placement.task,
									updatedAt: queryClient.getQueryState(key)?.dataUpdatedAt ?? 0,
								},
							]
						: []
				})
				.toSorted((a, b) => b.updatedAt - a.updatedAt)[0]?.task
	)
}
