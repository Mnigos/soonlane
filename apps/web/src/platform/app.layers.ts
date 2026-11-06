import { Layer } from 'effect'
import { BetterAuthLive } from '@/modules/identity/infrastructure/better-auth.layer'
import { TasksServiceLive } from '@/modules/tasks/application/tasks.service'
import { DrizzleTaskRepositoryLive } from '@/modules/tasks/infrastructure/task.repository'
import { AppConfigLive } from './config/app.config'
import { DbLive } from './db/db.layer'

export const AppLive = Layer.mergeAll(
	BetterAuthLive,
	TasksServiceLive.pipe(Layer.provide(DrizzleTaskRepositoryLive))
).pipe(Layer.provideMerge(DbLive), Layer.provideMerge(AppConfigLive))
