import { calendarContract } from './calendar.contract'
import { identityContract } from './identity.contract'
import { labelsContract } from './labels.contract'
import { projectsContract } from './projects.contract'
import { systemContract } from './system.contract'
import { tasksContract } from './tasks.contract'
import { todoistContract } from './todoist.contract'

export const contract = {
	calendar: calendarContract,
	identity: identityContract,
	labels: labelsContract,
	projects: projectsContract,
	system: systemContract,
	tasks: tasksContract,
	todoist: todoistContract,
}

export type Contract = typeof contract
