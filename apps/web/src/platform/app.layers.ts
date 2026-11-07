import { Layer } from 'effect'
import { PostHogAnalyticsLive } from '@/modules/analytics/infrastructure/posthog-analytics.layer'
import { BetterAuthLive } from '@/modules/identity/infrastructure/better-auth.layer'
import { LabelsServiceLive } from '@/modules/labels/application/labels.service'
import { DrizzleLabelRepositoryLive } from '@/modules/labels/infrastructure/label.repository'
import { TasksServiceLive } from '@/modules/tasks/application/tasks.service'
import { DrizzleTaskRepositoryLive } from '@/modules/tasks/infrastructure/task.repository'
import { AppConfigLive } from './config/app.config'
import { DbLive } from './db/db.layer'

export const AppLive = Layer.mergeAll(
	BetterAuthLive,
	LabelsServiceLive.pipe(Layer.provide(DrizzleLabelRepositoryLive)),
	TasksServiceLive.pipe(Layer.provide(DrizzleTaskRepositoryLive))
).pipe(
	Layer.provideMerge(PostHogAnalyticsLive),
	Layer.provideMerge(DbLive),
	Layer.provideMerge(AppConfigLive)
)
