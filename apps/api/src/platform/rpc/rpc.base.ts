import '@orpc/effect/extensions/effect'
import { middlewareGen } from '@orpc/effect'
import { implement } from '@orpc/server'
import { type Contract, contract } from '@soonlane/contracts'
import { Cause, Effect } from 'effect'
import { Analytics } from '@/modules/analytics/application/analytics.port'
import { AppConfig } from '../config/app.config'
import { DbError } from '../db/db.errors'
import { Maintenance } from '../system/maintenance.errors'
import {
	isBoundaryError,
	toFailureDetails,
	toORPCError,
} from './error-mapping.helper'
import type { RpcContext } from './rpc.context'

const base = implement(contract).$context<RpcContext>()

/** The procedures that only read. Every other one writes and is refused while maintenance is on, so a new procedure is refused until it is listed here. */
const READ_PROCEDURES: {
	readonly [
		TNamespace in keyof Contract
	]: readonly (keyof Contract[TNamespace])[]
} = {
	calendar: ['getSubscription'],
	identity: ['me'],
	labels: ['list'],
	projects: ['list'],
	system: ['health'],
	tasks: ['list', 'listByLabel', 'listByProject', 'listCompleted'],
}
const READ_PATHS = new Set(
	Object.entries(READ_PROCEDURES).flatMap(([namespace, names]) =>
		names.map(name => `${namespace}.${name}`)
	)
)

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

const refuseWritesInMaintenance = base.middleware(
	middlewareGen(function* refuseWritesInMaintenance({ next, path }) {
		const { maintenance } = yield* AppConfig

		if (maintenance && !READ_PATHS.has(path.join('.')))
			return yield* new Maintenance()

		return yield* next()
	})
)

export const os = base.use(mapDomainErrors).use(refuseWritesInMaintenance)
