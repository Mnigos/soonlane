import { type ListTasksOutput, listTasksInputSchema } from '@soonlane/contracts'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { z } from 'zod'
import { orpcQuery } from '@/platform/rpc/rpc-query.client'
import {
	findTaskPlacement,
	withoutTask,
	withTask,
} from '../helpers/task-list.helper'

// oRPC query keys are [path, { input, type }].
const listKeyOptionsSchema = z.object({ input: listTasksInputSchema })

export function useRescheduleTasks() {
	const queryClient = useQueryClient()
	const listKey = orpcQuery.tasks.list.key()

	const reschedule = useMutation(
		orpcQuery.tasks.reschedule.mutationOptions({
			onMutate: async ({ ids, dueDate }) => {
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
					const { data } = listKeyOptionsSchema.safeParse(key[1])
					const shown =
						data && data.input.from <= dueDate && dueDate <= data.input.to
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
