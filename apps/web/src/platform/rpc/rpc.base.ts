import '@orpc/experimental-effect/extensions/effect'
import { middlewareGen } from '@orpc/experimental-effect'
import { implement } from '@orpc/server'
import { contract } from '@soonlane/contracts'
import { Cause, Effect } from 'effect'
import { Analytics } from '@/modules/analytics/application/analytics.port'
import { isBoundaryError, toORPCError } from './error-mapping.helper'
import type { RpcContext } from './rpc.context'

const base = implement(contract).$context<RpcContext>()

function isExpected(cause: Cause.Cause<unknown>) {
	return Cause.hasInterruptsOnly(cause) || isBoundaryError(Cause.squash(cause))
}

// The single place where tagged domain and database errors become contract errors; anything else is reported.
const mapDomainErrors = base.middleware(
	middlewareGen(function* mapDomainErrors({ next, context }) {
		const analytics = yield* Analytics

		return yield* next().pipe(
			Effect.tapCause(cause =>
				isExpected(cause)
					? Effect.void
					: analytics.captureException(
							Cause.squash(cause),
							context.session?.user.id
						)
			),
			Effect.catchIf(isBoundaryError, error => Effect.fail(toORPCError(error)))
		)
	})
)

export const os = base.use(mapDomainErrors)
