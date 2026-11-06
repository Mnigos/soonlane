import type { ListTasksOutput, Task } from '@soonlane/contracts'

type TaskBucket = keyof ListTasksOutput

/** Where a task sits in one cached list, so a failed completion can put it back. */
interface TaskPlacement {
	bucket: TaskBucket
	task: Task
}

/** Scheduled tasks grouped by due date; the server already orders them within a day. */
export function groupTasksByDay(tasks: Task[]) {
	const days = new Map<string, Task[]>()

	for (const task of tasks)
		days.set(task.dueDate, [...(days.get(task.dueDate) ?? []), task])

	return days
}

// Sorts after every HH:MM due time, so untimed tasks come last like on the server.
const UNTIMED = '24:00'

// The server order: by day, timed tasks first by time, then by priority (P1 first), then oldest first.
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

/** The cached list with a task back in its place, keeping every other change to the list. */
export function withTask(
	list: ListTasksOutput,
	{ bucket, task }: TaskPlacement
): ListTasksOutput {
	const tasks = list[bucket]

	if (tasks.some(item => item.id === task.id)) return list

	return { ...list, [bucket]: [...tasks, task].toSorted(compareTasks) }
}
