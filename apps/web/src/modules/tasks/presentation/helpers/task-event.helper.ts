import type { Task } from '@soonlane/contracts'
import type { CalendarDate } from '@soonlane/domain'
import type { TaskEventProperties } from '@/modules/analytics/domain/analytics-event.types'
import { getDaysBetween } from '../../domain/calendar-date.helper'

/** What analytics may know about a task: its id, priority and due day relative to the browser's today. */
export function getTaskEventProperties(
	task: Task,
	today: CalendarDate
): TaskEventProperties {
	return {
		task_id: task.id,
		priority: task.priority,
		due_in_days: getDaysBetween(today, task.dueDate),
	}
}
