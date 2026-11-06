import { identityContract } from './identity.contract'
import { systemContract } from './system.contract'
import { tasksContract } from './tasks.contract'

export const contract = {
	identity: identityContract,
	system: systemContract,
	tasks: tasksContract,
}

export type Contract = typeof contract
