import {
	type ListTasksOutput,
	updateTaskInputSchema,
} from '@soonlane/contracts'
import {
	notifyManager,
	useMutation,
	useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { refreshTaskAndLabelLists } from '@/modules/labels/presentation/helpers/label-queries.helper'
import { orpcQuery } from '@/platform/rpc/rpc-query.client'
import { getEditedRule } from '../../domain/repeat-rule.helper'
import { getTaskListInput } from '../helpers/task-list-key.helper'
import {
	findTaskPlacement,
	placeTask,
	withMovedTask,
} from '../helpers/task-list.helper'

/** Saves an edited task at once (optimistically), moving it to wherever its new date and labels belong. */
export function useUpdateTask() {
	const queryClient = useQueryClient()
	const listKeys = [
		orpcQuery.tasks.list.key(),
		orpcQuery.tasks.listByLabel.key(),
	]

	const update = useMutation(
		orpcQuery.tasks.update.mutationOptions({
			onMutate: async variables => {
				const { id, labelIds, ...changes } =
					updateTaskInputSchema.parse(variables)

				// An Undo from an earlier completion would overwrite this edit's date.
				toast.dismiss(id)
				await Promise.all(
					listKeys.map(
						async queryKey => await queryClient.cancelQueries({ queryKey })
					)
				)
				const lists = listKeys.flatMap(queryKey =>
					queryClient.getQueriesData<ListTasksOutput>({ queryKey })
				)
				const previous = lists.map(([key, list]) => ({
					key,
					placement: list && findTaskPlacement(list, id),
				}))
				const current = previous.find(item => item.placement)?.placement?.task

				if (!current) return { previous }

				const knownLabels =
					queryClient.getQueryData(orpcQuery.labels.list.queryKey())?.labels ??
					current.labels
				// Like the server, an absent description or time clears it; an absent rule stays and null clears it.
				const task = {
					...current,
					description: undefined,
					dueTime: undefined,
					...changes,
					labels: labelIds
						? knownLabels.filter(label => labelIds.includes(label.id))
						: current.labels,
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
						const input = getTaskListInput(key)

						if (!input) continue

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
			// A refetch landing while another save is in flight would undo its optimistic change; the timeout runs once this save has left pending.
			onSettled: () => {
				setTimeout(() => {
					if (
						!queryClient.isMutating({
							mutationKey: orpcQuery.tasks.update.mutationKey(),
						})
					)
						void refreshTaskAndLabelLists(queryClient)
				}, 0)
			},
		})
	)

	return { updateTask: update.mutate }
}
