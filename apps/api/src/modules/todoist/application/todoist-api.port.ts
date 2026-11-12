import { Context, type Effect } from 'effect'
import type { TodoistSnapshot } from '../domain/todoist-snapshot.schemas'
import type {
	TodoistNotConfigured,
	TodoistReadFailed,
} from '../domain/todoist.errors'

/** Todoist's HTTP API on behalf of one connection; failures carry no token, URL or response body. */
export class TodoistApi extends Context.Service<
	TodoistApi,
	{
		/** One full sync of the account's user, projects, open tasks and labels. */
		readonly readSnapshot: (
			accessToken: string
		) => Effect.Effect<
			TodoistSnapshot,
			TodoistReadFailed | TodoistNotConfigured
		>
		/** Whether Todoist confirmed the revocation; an unknown or already revoked token counts as revoked. */
		readonly revoke: (token: string) => Effect.Effect<boolean>
	}
>()('soonlane/TodoistApi') {}
