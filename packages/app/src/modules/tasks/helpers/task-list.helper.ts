import {
	type ListTasksInput,
	type ListTasksOutput,
	listTasksOutputSchema,
	type Task,
} from '@soonlane/contracts'
import {
	type CalendarDate,
	TASK_DAY_ORDER,
	type TaskDayOrderKey,
} from '@soonlane/domain'
import type { QueryClient, QueryKey } from '@tanstack/react-query'
import { orpcQuery } from '../../../rpc-query.client'

type TaskBucket = keyof ListTasksOutput

const TASK_BUCKETS = listTasksOutputSchema.keyof().options

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
	const days = new Map<CalendarDate, Task[]>()

	for (const task of tasks)
		if (task.dueDate)
			days.set(task.dueDate, [...(days.get(task.dueDate) ?? []), task])

	return days
}

/** Sorts after every HH:MM due time, so untimed tasks come last like on the server. */
const UNTIMED = '24:00'
/** Sorts after every date, so tasks without one come last like the SQL's `asc` (nulls last). */
const UNDATED = '9999-12-31'

const DAY_ORDER_COMPARATORS: Record<
	TaskDayOrderKey,
	(a: Task, b: Task) => number
> = {
	dueDate: (a, b) => (a.dueDate ?? UNDATED).localeCompare(b.dueDate ?? UNDATED),
	dueTime: (a, b) => (a.dueTime ?? UNTIMED).localeCompare(b.dueTime ?? UNTIMED),
	priority: (a, b) => a.priority - b.priority,
	createdAt: (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
}

function compareTasks(a: Task, b: Task) {
	return TASK_DAY_ORDER.reduce(
		(result, key) => result || DAY_ORDER_COMPARATORS[key](a, b),
		0
	)
}

export function findTaskPlacement(
	list: ListTasksOutput,
	id: string
): TaskPlacement | undefined {
	for (const bucket of TASK_BUCKETS) {
		const task = list[bucket].find(item => item.id === id)

		if (task) return { bucket, task }
	}

	return undefined
}

/** The same change in every bucket; the literal fails to compile when the contract gains a bucket. */
function mapTaskBuckets(
	list: ListTasksOutput,
	change: (tasks: Task[]) => Task[]
): ListTasksOutput {
	return {
		undated: change(list.undated),
		overdue: change(list.overdue),
		scheduled: change(list.scheduled),
	}
}

/** The cached list without one task, for the optimistic update when it is completed. */
export function withoutTask(list: ListTasksOutput, id: string) {
	return mapTaskBuckets(list, tasks => tasks.filter(task => task.id !== id))
}

export function withUpdatedTask(list: ListTasksOutput, task: Task) {
	return mapTaskBuckets(list, tasks =>
		tasks.map(item => (item.id === task.id ? task : item))
	)
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
	if (task.dueDate === undefined)
		return labelId || projectId || !task.project
			? { bucket: 'undated', task }
			: undefined
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
