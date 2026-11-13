import { isDefinedError } from '@orpc/client'
import {
	type GoalInput,
	type ListTasksOutput,
	type Task,
	editTaskInputSchema,
} from '@soonlane/contracts'
import { type CalendarDate, getEditedSchedule } from '@soonlane/domain'
import {
	notifyManager,
	useMutation,
	useQueryClient,
} from '@tanstack/react-query'
import { getHostPorts } from '../../../host-ports.client'
import { orpcQuery } from '../../../rpc-query.client'
import {
	announceCompletion,
	getUndoCallbacks,
} from '../helpers/task-completion.helper'
import { getListInput } from '../helpers/task-list-key.helper'
import {
	findTaskPlacement,
	placeTask,
	refreshTaskLists,
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
 * Saves an edited task at once (optimistically), moving it to wherever its new date, labels and project belong.
 * A NOT_FOUND (the task or its new project was deleted) puts the task back and toasts the server's message.
 * A goal the progress already reaches completes the task with the "Task completed" toast and Undo, like a log.
 */
export function useUpdateTask(today: CalendarDate) {
	const queryClient = useQueryClient()
	const { dismissToast, showToast } = getHostPorts()
	const listKey = orpcQuery.tasks.list.key()
	const uncomplete = useMutation(
		orpcQuery.tasks.uncomplete.mutationOptions(
			getUndoCallbacks(queryClient, today)
		)
	)

	const update = useMutation(
		orpcQuery.tasks.edit.mutationOptions({
			onMutate: async variables => {
				const edit = editTaskInputSchema.parse(variables)
				const { id, labelIds, projectId, goal, description } = edit

				// An Undo from an earlier completion would overwrite this edit's date.
				dismissToast(id)
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

				const editedGoal = getEditedGoal(current.goal, goal)
				const isCompleted =
					editedGoal !== undefined && editedGoal.progress >= editedGoal.target
				const knownLabels =
					queryClient.getQueryData(orpcQuery.labels.list.queryKey())?.labels ??
					current.labels
				const knownProjects =
					queryClient.getQueryData(orpcQuery.projects.list.queryKey())
						?.projects ?? []
				const task = {
					...current,
					title: edit.title ?? current.title,
					description:
						description === undefined
							? current.description
							: description || undefined,
					priority: edit.priority ?? current.priority,
					...getEditedSchedule(current, edit),
					labels: labelIds
						? knownLabels.filter(label => labelIds.includes(label.id))
						: current.labels,
					project:
						projectId === undefined
							? current.project
							: knownProjects.find(project => project.id === projectId),
					goal: editedGoal,
				}

				// One render for every list (here and in the rollback), so a moved task never shows twice and its row can take focus there.
				notifyManager.batch(() => {
					for (const [key] of lists) {
						const input = getListInput(key)

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
				showToast(
					isDefinedError(error) && error.code === 'NOT_FOUND'
						? error.message
						: 'Could not save the task. Try again.'
				)
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
							mutationKey: orpcQuery.tasks.edit.mutationKey(),
						})
					)
						void refreshTaskLists(queryClient)
				}, 0)
			},
		})
	)

	return { updateTask: update.mutate }
}
