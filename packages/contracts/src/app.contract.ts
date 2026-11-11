import { calendarContract } from './calendar.contract'
import { identityContract } from './identity.contract'
import { labelsContract } from './labels.contract'
import { systemContract } from './system.contract'
import { tasksContract } from './tasks.contract'

export const contract = {
	calendar: calendarContract,
	identity: identityContract,
	labels: labelsContract,
	system: systemContract,
	tasks: tasksContract,
}

export type Contract = typeof contract
