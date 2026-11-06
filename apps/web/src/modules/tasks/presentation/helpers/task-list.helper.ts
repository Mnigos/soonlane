import type { ListTasksOutput, Task } from '@soonlist/contracts'

/** Scheduled tasks grouped by due date; the server already orders them within a day. */
export function groupTasksByDay(tasks: Task[]) {
	const days = new Map<string, Task[]>()

	for (const task of tasks)
		days.set(task.dueDate, [...(days.get(task.dueDate) ?? []), task])

	return days
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
