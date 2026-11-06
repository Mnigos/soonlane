import { identityRouter } from '@/modules/identity/presentation/identity.router'
import { tasksRouter } from '@/modules/tasks/presentation/tasks.router'
import { systemRouter } from '../system/system.router'

export const router = {
	identity: identityRouter,
	system: systemRouter,
	tasks: tasksRouter,
}
