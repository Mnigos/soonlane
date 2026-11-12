import { orpcQuery } from '@soonlane/app/rpc-query'
import {
	type GoalInput,
	type ListTasksOutput,
	type Task,
	updateTaskInputSchema,
} from '@soonlane/contracts'
import { type CalendarDate, getEditedRule } from '@soonlane/domain'
import {
	notifyManager,
	useMutation,
	useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { refreshTaskAndLabelLists } from '@/modules/labels/presentation/helpers/label-queries.helper'
import { toastFailure } from '@/modules/shell/presentation/helpers/maintenance.helper'
import {
	announceCompletion,
	getUndoCallbacks,
} from '../helpers/task-completion.helper'
import { getTaskListInput } from '../helpers/task-list-key.helper'
import {
	findTaskPlacement,
	placeTask,
	withMovedTask,
} from '../helpers/task-list.helper'

/** Like the server: absent keeps the goal, null removes it, a new target clamps the progress. */
function getEditedGoal(
	current: Task['goal'],
	goal: GoalInput | null | undefined
): Task['goal'] {
	if (goal === undefined) return current
	if (goal === null) return undefined

	return {
		...goal,
		progress: Math.min(current?.progress ?? 0, goal.target),
	}
}

/**
 * Saves an edited task at once (optimistically), moving it to wherever its new date and labels belong.
 * A goal the progress already reaches completes the task with the "Task completed" toast and Undo, like a log.
 */
export function useUpdateTask(today: CalendarDate) {
	const queryClient = useQueryClient()
	const listKeys = [
		orpcQuery.tasks.list.key(),
		orpcQuery.tasks.listByLabel.key(),
	]
	const uncomplete = useMutation(
		orpcQuery.tasks.uncomplete.mutationOptions(
			getUndoCallbacks(queryClient, today)
		)
	)

	const update = useMutation(
		orpcQuery.tasks.update.mutationOptions({
			onMutate: async variables => {
				const {
					id,
					labelIds,
					goal,
					today: _today,
					...changes
				} = updateTaskInputSchema.parse(variables)

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

				const editedGoal = getEditedGoal(current.goal, goal)
				const isCompleted =
					editedGoal !== undefined && editedGoal.progress >= editedGoal.target
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
					goal: editedGoal,
				}

				// One render for every list (here and in the rollback), so a moved task never shows twice and its row can take focus there.
				notifyManager.batch(() => {
					for (const [key] of lists) {
						const input = getTaskListInput(key)

						if (!input) continue

						queryClient.setQueryData<ListTasksOutput>(
							key,
							list =>
								list &&
								withMovedTask(
									list,
									id,
									isCompleted ? undefined : placeTask(task, input)
								)
						)
					}
				})

				return { previous }
			},
			// Restores only this task, so concurrent changes to the lists survive.
			onError: (error, { id }, context) => {
				notifyManager.batch(() => {
					for (const { key, placement } of context?.previous ?? [])
						queryClient.setQueryData<ListTasksOutput>(
							key,
							list => list && withMovedTask(list, id, placement)
						)
				})
				toastFailure(error, 'Could not save the task. Try again.')
			},
			onSuccess: ({ task, completed }) => {
				if (!completed) return

				const { dueDate, progress, goal } = completed

				announceCompletion({ ...task, dueDate }, today, 'goal', () =>
					uncomplete.mutate({
						id: task.id,
						dueDate: task.repeat ? dueDate : undefined,
						progress,
						goal,
					})
				)
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
