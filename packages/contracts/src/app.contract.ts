import { systemContract } from './system.contract'

export const contract = {
	system: systemContract,
}

export type Contract = typeof contract
