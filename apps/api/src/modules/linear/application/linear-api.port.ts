import type { OAuthTokenKind } from '@soonlane/auth'
import type { LinearIssue } from '@soonlane/contracts'
import { Context, type Effect } from 'effect'
import type {
	LinearConnectionLapsed,
	LinearReadFailed,
} from '../domain/linear.errors'

type LinearRead<T> = Effect.Effect<T, LinearReadFailed | LinearConnectionLapsed>

/** Linear's API on behalf of one connection; a read is lapsed when Linear refuses the token, and failures carry no token, URL or response body. */
export class LinearApi extends Context.Service<
	LinearApi,
	{
		/** The name of the workspace the token's user belongs to. */
		readonly readWorkspaceName: (accessToken: string) => LinearRead<string>
		/** The user's issues assigned to them that are neither completed nor canceled, recently updated first. */
		readonly listAssignedIssues: (
			accessToken: string
		) => LinearRead<LinearIssue[]>
		readonly searchIssues: (
			accessToken: string,
			term: string
		) => LinearRead<LinearIssue[]>
		/** By Linear's id or an identifier such as `SOON-28`; `undefined` for one the user cannot see. */
		readonly findIssue: (
			accessToken: string,
			idOrIdentifier: string
		) => LinearRead<LinearIssue | undefined>
		readonly listIssues: (
			accessToken: string,
			ids: readonly string[]
		) => LinearRead<LinearIssue[]>
		/** Whether Linear holds no grant for the token any more; an unknown or already revoked token counts as revoked. */
		readonly revoke: (
			token: string,
			kind: OAuthTokenKind
		) => Effect.Effect<boolean>
	}
>()('soonlane/LinearApi') {}
