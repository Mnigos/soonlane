import {
	type ListTasksOutput,
	listTasksInputSchema,
	updateTaskInputSchema,
} from '@soonlane/contracts'
import {
	notifyManager,
	useMutation,
	useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { z } from 'zod'
import { orpcQuery } from '@/platform/rpc/rpc-query.client'
import { getEditedRule } from '../../domain/repeat-rule.helper'
import {
	findTaskPlacement,
	placeTask,
	withMovedTask,
} from '../helpers/task-list.helper'

// oRPC query keys are [path, { input, type }]; the input tells where a list holds a task.
const listKeyOptionsSchema = z.object({ input: listTasksInputSchema })

/** Saves an edited task at once (optimistically), moving it to wherever its new date belongs. */
export function useUpdateTask() {
	const queryClient = useQueryClient()
	const listKey = orpcQuery.tasks.list.key()

	const update = useMutation(
		orpcQuery.tasks.update.mutationOptions({
			onMutate: async variables => {
				const { id, ...changes } = updateTaskInputSchema.parse(variables)

				// An Undo from an earlier completion would overwrite this edit's date.
				toast.dismiss(id)
				await queryClient.cancelQueries({ queryKey: listKey })
				const lists = queryClient.getQueriesData<ListTasksOutput>({
					queryKey: listKey,
				})
				const previous = lists.map(([key, list]) => ({
					key,
					placement: list && findTaskPlacement(list, id),
				}))
				const current = previous.find(item => item.placement)?.placement?.task

				if (!current) return { previous }

				// Like the server, an absent description or time clears it; an absent rule stays and null clears it.
				const task = {
					...current,
					description: undefined,
					dueTime: undefined,
					...changes,
					repeat: getEditedRule(
						current,
						changes.dueDate,
						changes.repeat === undefined
							? current.repeat
							: (changes.repeat ?? undefined)
					),
				}

				// One render for every list (here and in the rollback), so a moved task never shows twice and its row can take focus there.
				notifyManager.batch(() => {
					for (const [key] of lists) {
						const { input } = listKeyOptionsSchema.parse(key[1])

						queryClient.setQueryData<ListTasksOutput>(
							key,
							list => list && withMovedTask(list, id, placeTask(task, input))
						)
					}
				})

				return { previous }
			},
			// Restores only this task, so concurrent changes to the lists survive.
			onError: (_error, { id }, context) => {
				notifyManager.batch(() => {
					for (const { key, placement } of context?.previous ?? [])
						queryClient.setQueryData<ListTasksOutput>(
							key,
							list => list && withMovedTask(list, id, placement)
						)
				})
				toast('Could not save the task. Try again.')
			},
			// A refetch while another save is in flight would undo that save's optimistic change.
			onSettled: async () => {
				if (
					queryClient.isMutating({
						mutationKey: orpcQuery.tasks.update.mutationKey(),
					}) === 1
				)
					await Promise.all([
						queryClient.invalidateQueries({ queryKey: listKey }),
						queryClient.invalidateQueries({
							queryKey: orpcQuery.tasks.listByLabel.key(),
						}),
					])
			},
		})
	)

	return { updateTask: update.mutate }
}
