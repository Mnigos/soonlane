import type { Task } from '@soonlane/contracts'
import { type CalendarDate, toCalendarDate } from '@soonlane/domain'
import type { TaskEventProperties } from '@/modules/analytics/domain/analytics-event.types'
import { getDaysBetween } from '../../domain/calendar-date.helper'

export function getTaskEventProperties(
	task: Task,
	today: CalendarDate
): TaskEventProperties {
	return {
		task_id: task.id,
		priority: task.priority,
		due_in_days: getDaysBetween(today, toCalendarDate(task.dueDate)),
	}
}
