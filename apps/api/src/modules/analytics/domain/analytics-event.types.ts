import type {
	Checked,
	MatchesWireKeys,
	SuperProperties,
} from '@soonlane/analytics'
import type { SignInMethod } from '@soonlane/auth'

/** The events only the server sends, with their properties in camelCase; the browser's events are `ClientEvents` in `@soonlane/analytics`. */
export interface ServerEvents {
	user_signed_up: { $set_once: { createdAt: string; signupDate: string } }
	user_signed_in: { method: SignInMethod }
	first_task_created: { taskId: string }
	todoist_imported: {
		tasks: number
		changedTasks: number
		newLabels: number
		newProjects: number
	}
}

type ListedServerWireKey =
	| '$set_once'
	| 'created_at'
	| 'signup_date'
	| 'method'
	| 'task_id'
	| 'tasks'
	| 'changed_tasks'
	| 'new_labels'
	| 'new_projects'
	| 'app_version'
	| 'commit'
	| 'environment'

/** Every property key PostHog receives from the server, listed by hand; the PostHog insights and docs/analytics.md use these names. */
export type ServerWireKey = Checked<
	MatchesWireKeys<
		| ServerEvents[keyof ServerEvents]
		| Pick<SuperProperties, 'appVersion' | 'commit' | 'environment'>,
		ListedServerWireKey
	>,
	ListedServerWireKey
>
