import '@orpc/experimental-effect/extensions/effect'
import { middlewareGen } from '@orpc/experimental-effect'
import { implement } from '@orpc/server'
import { contract } from '@soonlane/contracts'
import { Cause, Effect } from 'effect'
import { Analytics } from '@/modules/analytics/application/analytics.port'
import { DbError } from '../db/db.errors'
import {
	isBoundaryError,
	toFailureDetails,
	toORPCError,
} from './error-mapping.helper'
import type { RpcContext } from './rpc.context'

const base = implement(contract).$context<RpcContext>()

/** Interrupts and domain errors are part of normal use; a DbError the service did not handle is a fault even though the client gets a mapped response. */
function isExpected(cause: Cause.Cause<unknown>) {
	const error = Cause.squash(cause)

	return (
		Cause.hasInterruptsOnly(cause) ||
		(isBoundaryError(error) && !(error instanceof DbError))
	)
}

const mapDomainErrors = base.middleware(
	middlewareGen(function* mapDomainErrors({ next, context }) {
		const analytics = yield* Analytics

		return yield* next().pipe(
			Effect.tapCause(cause => {
				if (isExpected(cause)) return Effect.void

				const error = Cause.squash(cause)
				const details = toFailureDetails(error)

				// Never pass the cause or the error itself: the logger would print its message, which embeds SQL parameters.
				return Effect.logError(
					'RPC procedure failed',
					error instanceof Error ? error.name : typeof error
				).pipe(
					Effect.annotateLogs(details),
					Effect.andThen(
						analytics.captureException(error, context.session?.user.id, details)
					)
				)
			}),
			Effect.catchIf(isBoundaryError, error => Effect.fail(toORPCError(error)))
		)
	})
)

export const os = base.use(mapDomainErrors)
