import { Layer } from 'effect'
import { AnalyticsServiceLive } from '@/modules/analytics/application/analytics.service'
import { PersonDeletionRepositoryLive } from '@/modules/analytics/infrastructure/person-deletion.repository'
import { PostHogAnalyticsLive } from '@/modules/analytics/infrastructure/posthog-analytics.layer'
import { CalendarServiceLive } from '@/modules/calendar/application/calendar.service'
import { CalendarSubscriptionRepositoryLive } from '@/modules/calendar/infrastructure/calendar-subscription.repository'
import { EmailLive } from '@/modules/email/infrastructure/email.layer'
import { BetterAuthLive } from '@/modules/identity/infrastructure/better-auth.layer'
import { LabelsServiceLive } from '@/modules/labels/application/labels.service'
import { LabelRepositoryLive } from '@/modules/labels/infrastructure/label.repository'
import { LinearServiceLive } from '@/modules/linear/application/linear.service'
import { HttpLinearApiLive } from '@/modules/linear/infrastructure/http-linear-api.layer'
import { LinearAccountRepositoryLive } from '@/modules/linear/infrastructure/linear-account.repository'
import { McpServiceLive } from '@/modules/mcp/application/mcp.service'
import { McpConnectionRepositoryLive } from '@/modules/mcp/infrastructure/mcp-connection.repository'
import { RateLimitRepositoryLive } from '@/modules/mcp/infrastructure/rate-limit.repository'
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
	McpServiceLive.pipe(
		Layer.provide(
			Layer.merge(McpConnectionRepositoryLive, RateLimitRepositoryLive)
		)
	),
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
	LinearServiceLive.pipe(
		Layer.provide(Layer.merge(LinearAccountRepositoryLive, HttpLinearApiLive))
	),
	CalendarServiceLive.pipe(
		Layer.provide(CalendarSubscriptionRepositoryLive),
		Layer.provideMerge(TasksServiceLive.pipe(Layer.provide(TaskRepositoryLive)))
	)
).pipe(
	Layer.provideMerge(BetterAuthLive),
	Layer.provideMerge(
		AnalyticsServiceLive.pipe(Layer.provide(PersonDeletionRepositoryLive))
	),
	Layer.provideMerge(Layer.merge(PostHogAnalyticsLive, EmailLive)),
	Layer.provideMerge(DbLive),
	Layer.provideMerge(AppConfigLive)
)

/** A logger or tracer goes beneath this with `Layer.provideMerge`, not beside it with `Layer.merge`, so both `runtime.run*` and the contexts layers capture with `Effect.context()` see it. */
export const AppLive = HttpServerLive.pipe(Layer.provideMerge(ServicesLive))
