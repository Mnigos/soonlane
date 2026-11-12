import type {
	Label,
	ListedLabel,
	ListTasksOutput,
	Task,
} from '@soonlane/contracts'
import type { LabelColor, LabelId } from '@soonlane/domain'
import type { QueryClient } from '@tanstack/react-query'
import { orpcQuery } from '../../../rpc-query.client'

/**
 * Shows a label in a new color in the labels list and on every task that carries it, before the server confirms it.
 * Returns the color it had, so a failed save can paint that back.
 */
export async function paintLabel(
	queryClient: QueryClient,
	id: LabelId,
	color: LabelColor | undefined
) {
	const labelsKey = orpcQuery.labels.list.key()
	const taskListKey = orpcQuery.tasks.list.key()
	const paint = <TLabel extends Label>(label: TLabel) =>
		label.id === id ? { ...label, color } : label
	const paintTasks = (tasks: Task[]) =>
		tasks.map(task =>
			task.labels.some(label => label.id === id)
				? { ...task, labels: task.labels.map(paint) }
				: task
		)

	await Promise.all(
		[labelsKey, taskListKey].map(
			async queryKey => await queryClient.cancelQueries({ queryKey })
		)
	)
	const previousColor = queryClient
		.getQueriesData<{ labels: ListedLabel[] }>({ queryKey: labelsKey })
		.flatMap(([, list]) => list?.labels ?? [])
		.find(label => label.id === id)?.color

	queryClient.setQueriesData<{ labels: ListedLabel[] }>(
		{ queryKey: labelsKey },
		list => list && { labels: list.labels.map(paint) }
	)
	queryClient.setQueriesData<ListTasksOutput>(
		{ queryKey: taskListKey },
		list =>
			list && {
				undated: paintTasks(list.undated),
				overdue: paintTasks(list.overdue),
				scheduled: paintTasks(list.scheduled),
			}
	)
	void queryClient.invalidateQueries({
		queryKey: orpcQuery.tasks.search.key(),
	})

	return previousColor
}
