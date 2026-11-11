import {
	type ListTasksOutput,
	rescheduleTasksInputSchema,
} from '@soonlane/contracts'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { orpcQuery } from '@/platform/rpc/rpc-query.client'
import { getListInput } from '../helpers/task-list-key.helper'
import {
	findTaskPlacement,
	withoutTask,
	withTask,
} from '../helpers/task-list.helper'

/** Moves tasks to another day at once (optimistically), keeping their due times. */
export function useRescheduleTasks() {
	const queryClient = useQueryClient()
	const listKey = orpcQuery.tasks.list.key()

	const reschedule = useMutation(
		orpcQuery.tasks.reschedule.mutationOptions({
			onMutate: async variables => {
				const { ids, dueDate } = rescheduleTasksInputSchema.parse(variables)

				await queryClient.cancelQueries({ queryKey: listKey })
				const lists = queryClient
					.getQueriesData<ListTasksOutput>({ queryKey: listKey })
					.flatMap(([key, list]) => (list ? [{ key, list }] : []))
				const removed = lists.map(({ key, list }) => ({
					key,
					placements: ids.flatMap(id => findTaskPlacement(list, id) ?? []),
				}))
				const moved = new Map(
					removed.flatMap(({ placements }) =>
						placements.map(({ task }) => [task.id, { ...task, dueDate }])
					)
				)

				for (const { key, list } of lists) {
					const input = getListInput(key)
					const shown =
						input && input.from <= dueDate && dueDate <= input.to
							? [...moved.values()]
							: []

					queryClient.setQueryData<ListTasksOutput>(
						key,
						shown
							.map(task => ({ bucket: 'scheduled' as const, task }))
							.reduce(withTask, ids.reduce(withoutTask, list))
					)
				}

				return { removed }
			},
			// Puts back only these tasks, so concurrent changes to the lists survive.
			onError: (_error, { ids }, context) => {
				for (const { key, placements } of context?.removed ?? [])
					queryClient.setQueryData<ListTasksOutput>(
						key,
						list =>
							list && placements.reduce(withTask, ids.reduce(withoutTask, list))
					)
				toast('Could not reschedule the tasks. Try again.')
			},
			onSettled: async () =>
				await Promise.all([
					queryClient.invalidateQueries({ queryKey: listKey }),
					queryClient.invalidateQueries({
						queryKey: orpcQuery.tasks.listByLabel.key(),
					}),
				]),
		})
	)

	return { rescheduleTasks: reschedule.mutate }
}
