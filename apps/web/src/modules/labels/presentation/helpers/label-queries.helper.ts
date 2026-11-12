import { orpcQuery } from '@soonlane/app/rpc-query'
import type {
	Label,
	ListedLabel,
	ListTasksOutput,
	Task,
} from '@soonlane/contracts'
import type { LabelColor, LabelId } from '@soonlane/domain'
import type { QueryClient } from '@tanstack/react-query'

/** Task rows show label names and the sidebar counts open tasks per label, so both lists follow either change. */
export async function refreshTaskAndLabelLists(queryClient: QueryClient) {
	await Promise.all([
		queryClient.invalidateQueries({ queryKey: orpcQuery.tasks.list.key() }),
		queryClient.invalidateQueries({
			queryKey: orpcQuery.tasks.listByLabel.key(),
		}),
		queryClient.invalidateQueries({
			queryKey: orpcQuery.tasks.listCompleted.key(),
		}),
		queryClient.invalidateQueries({ queryKey: orpcQuery.labels.list.key() }),
	])
}

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
	const taskListKeys = [
		orpcQuery.tasks.list.key(),
		orpcQuery.tasks.listByLabel.key(),
	]
	const paint = <TLabel extends Label>(label: TLabel) =>
		label.id === id ? { ...label, color } : label
	const paintTasks = (tasks: Task[]) =>
		tasks.map(task =>
			task.labels.some(label => label.id === id)
				? { ...task, labels: task.labels.map(paint) }
				: task
		)

	await Promise.all(
		[labelsKey, ...taskListKeys].map(
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
	for (const queryKey of taskListKeys)
		queryClient.setQueriesData<ListTasksOutput>(
			{ queryKey },
			list =>
				list && {
					overdue: paintTasks(list.overdue),
					scheduled: paintTasks(list.scheduled),
				}
		)

	return previousColor
}
