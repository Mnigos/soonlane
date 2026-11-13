import { orpcQuery } from '@soonlane/app/rpc-query'
import { findTaskPlacement } from '@soonlane/app/tasks/helpers/task-list.helper'
import type { ListTasksOutput, SearchTasksOutput } from '@soonlane/contracts'
import { useQueryClient } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'

/**
 * A task as the most recently written cached list or search result holds it, so every optimistic change shows and a
 * search hit outside the loaded lists opens too; undefined once none holds it open.
 */
export function useCachedTask(id: string) {
	const queryClient = useQueryClient()

	return useSyncExternalStore(
		queryClient.getQueryCache().subscribe,
		() =>
			[
				...queryClient
					.getQueriesData<ListTasksOutput>({
						queryKey: orpcQuery.tasks.list.key(),
					})
					.map(([key, list]) => ({
						key,
						task: list && findTaskPlacement(list, id)?.task,
					})),
				...queryClient
					.getQueriesData<SearchTasksOutput>({
						queryKey: orpcQuery.tasks.search.key(),
					})
					.map(([key, result]) => ({
						key,
						task: result?.tasks.find(
							task => task.id === id && !task.completedAt
						),
					})),
			]
				.flatMap(({ key, task }) =>
					task
						? [
								{
									task,
									updatedAt: queryClient.getQueryState(key)?.dataUpdatedAt ?? 0,
								},
							]
						: []
				)
				.toSorted((a, b) => b.updatedAt - a.updatedAt)[0]?.task
	)
}
