import { Layer } from 'effect'
import { PostHogAnalyticsLive } from '@/modules/analytics/infrastructure/posthog-analytics.layer'
import { CalendarServiceLive } from '@/modules/calendar/application/calendar.service'
import { CalendarSubscriptionRepositoryLive } from '@/modules/calendar/infrastructure/calendar-subscription.repository'
import { BetterAuthLive } from '@/modules/identity/infrastructure/better-auth.layer'
import { LabelsServiceLive } from '@/modules/labels/application/labels.service'
import { LabelRepositoryLive } from '@/modules/labels/infrastructure/label.repository'
import { ProjectsServiceLive } from '@/modules/projects/application/projects.service'
import { ProjectRepositoryLive } from '@/modules/projects/infrastructure/project.repository'
import { TasksServiceLive } from '@/modules/tasks/application/tasks.service'
import { TaskRepositoryLive } from '@/modules/tasks/infrastructure/task.repository'
import { TodoistServiceLive } from '@/modules/todoist/application/todoist.service'
import { HttpTodoistApiLive } from '@/modules/todoist/infrastructure/http-todoist-api.layer'
import { ImportedTodoistTaskRepositoryLive } from '@/modules/todoist/infrastructure/imported-todoist-task.repository'
import { TodoistAccountRepositoryLive } from '@/modules/todoist/infrastructure/todoist-account.repository'
import { AppConfigLive } from './config/app.config'
import { DbLive } from './db/db.layer'
import { HttpServerLive } from './http/http-server.layer'

/** Everything a request handler reaches: the services, the adapters behind their ports, the repositories and the shared infrastructure. */
export const ServicesLive = Layer.mergeAll(
	TodoistServiceLive.pipe(
		Layer.provide(
			Layer.mergeAll(
				TodoistAccountRepositoryLive,
				ImportedTodoistTaskRepositoryLive,
				HttpTodoistApiLive
			)
		),
		Layer.provideMerge(
			Layer.merge(
				LabelsServiceLive.pipe(Layer.provide(LabelRepositoryLive)),
				ProjectsServiceLive.pipe(Layer.provide(ProjectRepositoryLive))
			)
		)
	),
	CalendarServiceLive.pipe(
		Layer.provide(CalendarSubscriptionRepositoryLive),
		Layer.provideMerge(TasksServiceLive.pipe(Layer.provide(TaskRepositoryLive)))
	)
).pipe(
	Layer.provideMerge(BetterAuthLive),
	Layer.provideMerge(PostHogAnalyticsLive),
	Layer.provideMerge(DbLive),
	Layer.provideMerge(AppConfigLive)
)

/** A logger or tracer goes beneath this with `Layer.provideMerge`, not beside it with `Layer.merge`, so both `runtime.run*` and the contexts layers capture with `Effect.context()` see it. */
export const AppLive = HttpServerLive.pipe(Layer.provideMerge(ServicesLive))
