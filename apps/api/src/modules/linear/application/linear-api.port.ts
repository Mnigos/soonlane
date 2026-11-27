import type { OAuthTokenKind } from '@soonlane/auth'
import { Context, type Effect } from 'effect'
import type {
	LinearConnectionLapsed,
	LinearReadFailed,
} from '../domain/linear.errors'

/** Linear's API on behalf of one connection; failures carry no token, URL or response body. */
export class LinearApi extends Context.Service<
	LinearApi,
	{
		/** The name of the workspace the token's user belongs to; lapsed when Linear refuses the token. */
		readonly readWorkspaceName: (
			accessToken: string
		) => Effect.Effect<string, LinearReadFailed | LinearConnectionLapsed>
		/** Whether Linear holds no grant for the token any more; an unknown or already revoked token counts as revoked. */
		readonly revoke: (
			token: string,
			kind: OAuthTokenKind
		) => Effect.Effect<boolean>
	}
>()('soonlane/LinearApi') {}
