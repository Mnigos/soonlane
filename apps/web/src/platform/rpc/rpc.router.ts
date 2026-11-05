import { identityRouter } from '@/modules/identity/presentation/identity.router'
import { systemRouter } from '../system/system.router'

export const router = {
	identity: identityRouter,
	system: systemRouter,
}
