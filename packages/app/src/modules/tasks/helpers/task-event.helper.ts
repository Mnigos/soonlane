import type { TaskEventProperties } from '@soonlane/analytics'
import type { Task } from '@soonlane/contracts'
import { type CalendarDate, getDaysBetween } from '@soonlane/domain'

/** What analytics may know about a task: its id, priority and due day relative to the browser's today. */
export function getTaskEventProperties(
	task: Task,
	today: CalendarDate
): TaskEventProperties {
	return {
		taskId: task.id,
		priority: task.priority,
		dueInDays:
			task.dueDate === undefined
				? undefined
				: getDaysBetween(today, task.dueDate),
	}
}
