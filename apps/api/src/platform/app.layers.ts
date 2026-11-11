import { Layer } from 'effect'
import { PostHogAnalyticsLive } from '@/modules/analytics/infrastructure/posthog-analytics.layer'
import { CalendarServiceLive } from '@/modules/calendar/application/calendar.service'
import { DrizzleCalendarSubscriptionRepositoryLive } from '@/modules/calendar/infrastructure/calendar-subscription.repository'
import { BetterAuthLive } from '@/modules/identity/infrastructure/better-auth.layer'
import { LabelsServiceLive } from '@/modules/labels/application/labels.service'
import { DrizzleLabelRepositoryLive } from '@/modules/labels/infrastructure/label.repository'
import { TasksServiceLive } from '@/modules/tasks/application/tasks.service'
import { DrizzleTaskRepositoryLive } from '@/modules/tasks/infrastructure/task.repository'
import { AppConfigLive } from './config/app.config'
import { DbLive } from './db/db.layer'
import { HttpServerLive } from './http/http-server.layer'

/** Everything a request handler reaches: the services, their ports' adapters and the shared infrastructure. */
export const ServicesLive = Layer.mergeAll(
	BetterAuthLive,
	LabelsServiceLive.pipe(Layer.provide(DrizzleLabelRepositoryLive)),
	CalendarServiceLive.pipe(
		Layer.provide(DrizzleCalendarSubscriptionRepositoryLive),
		Layer.provideMerge(
			TasksServiceLive.pipe(Layer.provide(DrizzleTaskRepositoryLive))
		)
	)
).pipe(
	Layer.provideMerge(PostHogAnalyticsLive),
	Layer.provideMerge(DbLive),
	Layer.provideMerge(AppConfigLive)
)

export const AppLive = HttpServerLive.pipe(Layer.provideMerge(ServicesLive))
