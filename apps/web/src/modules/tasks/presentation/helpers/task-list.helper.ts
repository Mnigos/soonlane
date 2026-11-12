import { orpcQuery } from '@soonlane/app/rpc-query'
import type { ListTasksInput, ListTasksOutput, Task } from '@soonlane/contracts'
import type { QueryClient, QueryKey } from '@tanstack/react-query'

type TaskBucket = keyof ListTasksOutput

/** Where a task sits in one cached list, so a failed change can put it back. */
interface TaskPlacement {
	bucket: TaskBucket
	task: Task
}

interface CachedPlacement {
	key: QueryKey
	placement: TaskPlacement
}

/** Scheduled tasks grouped by due date; the server already orders them within a day. */
export function groupTasksByDay(tasks: Task[]) {
	const days = new Map<Task['dueDate'], Task[]>()

	for (const task of tasks)
		days.set(task.dueDate, [...(days.get(task.dueDate) ?? []), task])

	return days
}

/** Sorts after every HH:MM due time, so untimed tasks come last like on the server. */
const UNTIMED = '24:00'

/** Keep in sync with DAY_ORDER in task.repository.ts. */
function compareTasks(a: Task, b: Task) {
	return (
		a.dueDate.localeCompare(b.dueDate) ||
		(a.dueTime ?? UNTIMED).localeCompare(b.dueTime ?? UNTIMED) ||
		a.priority - b.priority ||
		a.createdAt.getTime() - b.createdAt.getTime()
	)
}

export function findTaskPlacement(
	list: ListTasksOutput,
	id: string
): TaskPlacement | undefined {
	for (const bucket of ['overdue', 'scheduled'] as const) {
		const task = list[bucket].find(item => item.id === id)

		if (task) return { bucket, task }
	}

	return undefined
}

/** The cached list without one task, for the optimistic update when it is completed. */
export function withoutTask(
	list: ListTasksOutput,
	id: string
): ListTasksOutput {
	return {
		overdue: list.overdue.filter(task => task.id !== id),
		scheduled: list.scheduled.filter(task => task.id !== id),
	}
}

export function withUpdatedTask(
	list: ListTasksOutput,
	task: Task
): ListTasksOutput {
	const update = (tasks: Task[]) =>
		tasks.map(item => (item.id === task.id ? task : item))

	return { overdue: update(list.overdue), scheduled: update(list.scheduled) }
}

/** The cached list with a task back in its place, keeping every other change to the list. */
export function withTask(
	list: ListTasksOutput,
	{ bucket, task }: TaskPlacement
): ListTasksOutput {
	const tasks = list[bucket]

	if (tasks.some(item => item.id === task.id)) return list

	return { ...list, [bucket]: [...tasks, task].toSorted(compareTasks) }
}

/** Where a task belongs in a list loaded with these filters, as the server would place it. */
export function placeTask(
	task: Task,
	{ today, from, to, labelId, projectId }: ListTasksInput
): TaskPlacement | undefined {
	if (labelId && !task.labels.some(({ id }) => id === labelId)) return undefined
	if (projectId && task.project?.id !== projectId) return undefined
	if (task.dueDate < today) return { bucket: 'overdue', task }
	if (!from || !to || (from <= task.dueDate && task.dueDate <= to))
		return { bucket: 'scheduled', task }

	return undefined
}

/** The cached list with a task taken out and, given a placement, put there instead. */
export function withMovedTask(
	list: ListTasksOutput,
	id: string,
	placement: TaskPlacement | undefined
): ListTasksOutput {
	const rest = withoutTask(list, id)

	return placement ? withTask(rest, placement) : rest
}

/** Takes a task out of every cached task list at once, returning where it sat for {@link restoreCachedTask}. */
export async function removeCachedTask(queryClient: QueryClient, id: string) {
	const queryKey = orpcQuery.tasks.list.key()

	await queryClient.cancelQueries({ queryKey })
	const removed = queryClient
		.getQueriesData<ListTasksOutput>({ queryKey })
		.flatMap(([key, list]): CachedPlacement[] => {
			const placement = list && findTaskPlacement(list, id)

			return placement ? [{ key, placement }] : []
		})

	queryClient.setQueriesData<ListTasksOutput>(
		{ queryKey },
		list => list && withoutTask(list, id)
	)

	return removed
}

/** Puts back only this task, so a concurrent change to the lists survives. */
export function restoreCachedTask(
	queryClient: QueryClient,
	removed: CachedPlacement[] = []
) {
	for (const { key, placement } of removed)
		queryClient.setQueryData<ListTasksOutput>(
			key,
			list => list && withTask(list, placement)
		)
}
