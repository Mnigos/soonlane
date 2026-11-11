import { calendarRouter } from '@/modules/calendar/presentation/calendar.router'
import { identityRouter } from '@/modules/identity/presentation/identity.router'
import { labelsRouter } from '@/modules/labels/presentation/labels.router'
import { tasksRouter } from '@/modules/tasks/presentation/tasks.router'
import { systemRouter } from '../system/system.router'

export const router = {
	calendar: calendarRouter,
	identity: identityRouter,
	labels: labelsRouter,
	system: systemRouter,
	tasks: tasksRouter,
}
