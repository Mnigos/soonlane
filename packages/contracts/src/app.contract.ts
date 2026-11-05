import { identityContract } from './identity.contract'
import { systemContract } from './system.contract'

export const contract = {
	identity: identityContract,
	system: systemContract,
}

export type Contract = typeof contract
