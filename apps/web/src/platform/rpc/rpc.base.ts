import '@orpc/experimental-effect/extensions/effect'
import { middlewareGen } from '@orpc/experimental-effect'
import { implement } from '@orpc/server'
import { contract } from '@soonlist/contracts'
import { Effect } from 'effect'
import { isBoundaryError, toORPCError } from './error-mapping.helper'
import type { RpcContext } from './rpc.context'

const base = implement(contract).$context<RpcContext>()

// The single place where tagged domain and database errors become contract errors.
const mapDomainErrors = base.middleware(
	middlewareGen(function* mapDomainErrors({ next }) {
		return yield* next().pipe(
			Effect.catchIf(isBoundaryError, error => Effect.fail(toORPCError(error)))
		)
	})
)

export const os = base.use(mapDomainErrors)
